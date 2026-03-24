const easyinvoice = require('easyinvoice');
const nodemailer = require('nodemailer');
const Invoice = require('../models/Invoice');





async function emailInvoice(req, res) {
  try{
    const {invoice_id}=req.params;
    if (!invoice_id) {
      return res.status(400).json({ message: "Invalid url" });
    }

    const invoice = await Invoice.findById(invoice_id).populate('invoice_client_id').populate('invoice_project_id').populate('particulars.task_id').populate('invoice_user_id');
    if (!invoice) {
      return res.status(404).json({ message: "Problem while fetching invoice details" });
    }


    const data = {
    apiKey: "free", 
    mode: "development",  
    images: {
        
       // logo: "https://images.app.goo.gl/2dstRUmj2iJ9Bedp8",
        // The invoice background
      //  background: "https://public.budgetinvoice.com/img/watermark-draft.jpg"
    },
    // Your own data
    sender: {
        company: invoice.invoice_user_id.user_company ,
        address: invoice.invoice_user_id.user_address,
      //  zip: "1234 AB",
       // city: "Sampletown",
        country: "India"
        
    },
    // Your recipient
    client: {
        company: invoice.invoice_client_id.client_company,
        address: invoice.invoice_client_id.client_address,
       // zip: "4567 CD",
     //   city: "Clientcity",
        country: "India"
        // custom1: "custom value 1",
        // custom2: "custom value 2",
        // custom3: "custom value 3"
    },
    information: {
        // Invoice number
        number: invoice.invoice_number,
        // Invoice data
        date: invoice.invoice_date.toISOString().split('T')[0],
        project:invoice.invoice_project_id.project_name // Format date to YYYY-MM-DD
        // Invoice due date
        //dueDate: "31-12-2021"
    },
   // The products you would like to see on your invoice
    // Total values are being calculated automatically 
    products: invoice.particulars.map(particular => ({
        quantity: 1, // Assuming each task is billed as a single unit
        description: particular.task_name,
        // The price of a single product
        price: particular.task_amount,
        // The tax rate of a single product
        // tax: 19.00 // Defaults to 0.00, can be used to set a tax rate
    })),
    // The message you would like to display on the bottom of your invoice
    bottomNotice: "Thank you for your business!",
    // Settings to customize your invoice
    settings: {
        currency: "USD", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        // locale: "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
        // marginTop: 25, // Defaults to '25'
        // marginRight: 25, // Defaults to '25'
        // marginLeft: 25, // Defaults to '25'
        // marginBottom: 25, // Defaults to '25'
        // format: "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
        // height: "1000px", // allowed units: mm, cm, in, px
        // width: "500px", // allowed units: mm, cm, in, px
        // orientation: "landscape" // portrait or landscape, defaults to portrait
    },
    // Translate your invoice to your preferred language
    translate: {
        // invoice: "FACTUUR",  // Default to 'INVOICE'
        // number: "Nummer", // Defaults to 'Number'
        // date: "Datum", // Default to 'Date'
        // dueDate: "Verloopdatum", // Defaults to 'Due Date'
        // subtotal: "Subtotaal", // Defaults to 'Subtotal'
        // products: "Producten", // Defaults to 'Products'
        // quantity: "Aantal", // Default to 'Quantity'
        // price: "Prijs", // Defaults to 'Price'
        // productTotal: "Totaal", // Defaults to 'Total'
        // total: "Totaal", // Defaults to 'Total'
        // taxNotation: "btw" // Defaults to 'vat'
    },

    // Customize enables you to provide your own templates
    // Please review the documentation for instructions and examples
    // "customize": {
    //      "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
    // }
};

const result = await easyinvoice.createInvoice(data);

const transporter = nodemailer.createTransport({
     service:"gmail",
        auth: {
            user:process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS 
        }
    });

    const mailOptions = {
        from: process.env.GMAIL_USER, // sender address
        to: invoice.invoice_client_id.client_email, // list of receivers
        subject: `Invoice #${invoice.invoice_number}`, // Subject line
        text: `Dear ${invoice.invoice_client_id.client_name},\n\nPlease find attached the invoice #${invoice.invoice_number}.\n\nThank you!`, // plain text body
        attachments: [
            {
                filename: `invoice_${invoice.invoice_number}.pdf`,
                content: result.pdf,
                encoding: 'base64'
            }
        ]
    };
    console.log(data);
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Error sending email", error: error.message });
        }
        console.log("Email sent successfully:", info.response);
        res.status(200).json({ message: "Invoice sent successfully", info: info.response });
    });

  
    // Call the Mailjet API function to send the invoice
}catch (error) {
    console.error("Error sending invoice:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }}





module.exports = {
  emailInvoice
};