const easyinvoice = require('easyinvoice');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');

function formatAmount(value) {
  return `${(Number(value) || 0).toFixed(2)} USD`;
}

function generateFallbackInvoicePdf(invoice, products) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      doc.on('error', reject);

      const invoiceDate = new Date(invoice.invoice_date || Date.now()).toISOString().split('T')[0];
      const senderName = invoice.invoice_user_id?.user_company || 'SoloFlow';
      const senderAddress =
        invoice.invoice_user_id?.user_address || invoice.invoice_user_id?.user_company || 'N/A';
      const clientName =
        invoice.invoice_client_id?.client_company || invoice.invoice_client_id?.client_name || 'Client';
      const clientAddress = invoice.invoice_client_id?.client_address || 'N/A';

      doc.fontSize(20).text(`Invoice #${invoice.invoice_number}`);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#555555').text(`Date: ${invoiceDate}`);
      doc.text(`Project: ${invoice.invoice_project_id?.project_name || 'Project'}`);
      doc.moveDown();

      doc.fillColor('#000000').fontSize(12).text('From');
      doc.fontSize(10).text(senderName);
      doc.text(senderAddress);
      doc.moveDown(0.7);

      doc.fontSize(12).text('Bill To');
      doc.fontSize(10).text(clientName);
      doc.text(clientAddress);
      doc.moveDown();

      const tableTop = doc.y + 6;
      doc.fontSize(11).text('Description', 50, tableTop);
      doc.text('Amount', 430, tableTop, { width: 110, align: 'right' });
      doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor('#cccccc').stroke();

      let y = tableTop + 24;
      let total = 0;
      for (const item of products) {
        const price = Number(item.price) || 0;
        total += price;

        if (y > 740) {
          doc.addPage();
          y = 50;
        }

        doc.fontSize(10).fillColor('#000000').text(item.description || 'Task', 50, y, { width: 340 });
        doc.text(formatAmount(price), 430, y, { width: 110, align: 'right' });
        y += 20;
      }

      doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor('#cccccc').stroke();
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Total: ${formatAmount(total)}`, 350, y + 14, { width: 195, align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function emailInvoice(req, res) {
  try {
    const { invoice_id } = req.params;
    if (!invoice_id || !mongoose.Types.ObjectId.isValid(invoice_id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return res.status(500).json({ message: 'Email service is not configured on server' });
    }

    const invoice = await Invoice.findById(invoice_id)
      .populate('invoice_client_id')
      .populate('invoice_project_id')
      .populate('particulars.task_id')
      .populate('invoice_user_id');

    if (!invoice) {
      return res.status(404).json({ message: 'Problem while fetching invoice details' });
    }

    if (!invoice.invoice_client_id?.client_email) {
      return res.status(400).json({ message: 'Client email is missing for this invoice' });
    }

    const products = (invoice.particulars || [])
      .map((particular) => ({
        quantity: 1,
        description: particular.task_name || 'Task',
        price: Number(particular.task_amount) || 0,
      }))
      .filter((item) => Number.isFinite(item.price));

    if (products.length === 0) {
      return res.status(400).json({ message: 'No invoice items found to send' });
    }

    const invoicePayload = {
      mode: 'development',
      sender: {
        company: invoice.invoice_user_id?.user_company || 'SoloFlow',
        address: invoice.invoice_user_id?.user_address || invoice.invoice_user_id?.user_company || 'N/A',
        country: 'India',
      },
      client: {
        company: invoice.invoice_client_id?.client_company || invoice.invoice_client_id?.client_name || 'Client',
        address: invoice.invoice_client_id?.client_address || 'N/A',
        country: 'India',
      },
      information: {
        number: invoice.invoice_number,
        date: new Date(invoice.invoice_date || Date.now()).toISOString().split('T')[0],
        project: invoice.invoice_project_id?.project_name || 'Project',
      },
      products,
      bottomNotice: 'Thank you for your business!',
      settings: {
        currency: 'USD',
      },
    };

    const isDevelopmentMode = process.env.NODE_ENV !== 'production';
    const configuredApiKey = (process.env.EASYINVOICE_API_KEY || (isDevelopmentMode ? 'free' : '')).trim();
    let generatedPdfBase64 = null;
    let attachmentSource = null;

    const easyInvoicePayload = {
      ...invoicePayload,
      ...(configuredApiKey ? { apiKey: configuredApiKey } : {}),
    };

    try {
      const result = await easyinvoice.createInvoice(easyInvoicePayload);
      generatedPdfBase64 = result?.pdf || null;
      attachmentSource = generatedPdfBase64 ? 'easyinvoice' : null;
    } catch (pdfError) {
      console.error('Invoice PDF generation with easyinvoice failed:', pdfError.message || pdfError);

      if (configuredApiKey && configuredApiKey.toLowerCase() === 'free') {
        try {
          const resultWithoutApiKey = await easyinvoice.createInvoice(invoicePayload);
          generatedPdfBase64 = resultWithoutApiKey?.pdf || null;
          attachmentSource = generatedPdfBase64 ? 'easyinvoice' : null;
        } catch (retryError) {
          console.error('Retrying easyinvoice without apiKey failed:', retryError.message || retryError);
        }
      }
    }

    if (!generatedPdfBase64) {
      try {
        generatedPdfBase64 = await generateFallbackInvoicePdf(invoice, products);
        attachmentSource = generatedPdfBase64 ? 'local-fallback' : null;
      } catch (fallbackError) {
        console.error('Local fallback invoice PDF generation failed:', fallbackError.message || fallbackError);
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: invoice.invoice_client_id.client_email,
      subject: `Invoice #${invoice.invoice_number}`,
      text: `Dear ${invoice.invoice_client_id.client_name},\n\nPlease find your invoice #${invoice.invoice_number}.${generatedPdfBase64 ? ' The PDF is attached.' : ' We could not attach the PDF this time.'}\n\nThank you!`,
    };

    if (generatedPdfBase64) {
      mailOptions.attachments = [
        {
          filename: `invoice_${invoice.invoice_number}.pdf`,
          content: generatedPdfBase64,
          encoding: 'base64',
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      message: generatedPdfBase64
        ? 'Invoice sent successfully with PDF attachment'
        : 'Invoice email sent successfully without PDF attachment',
      info: info.response,
      attachmentIncluded: Boolean(generatedPdfBase64),
      attachmentSource,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

module.exports = {
  emailInvoice,
};