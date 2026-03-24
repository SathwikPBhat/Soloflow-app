function isValidPassword(password) {
  const lengthCheck = password.length >= 8 && password.length <= 20;
  const upperCaseCheck = /[A-Z]/.test(password);
  const lowerCaseCheck = /[a-z]/.test(password);
  const digitCheck = /\d/.test(password);
  const specialCharCheck = /[\W_]/.test(password);
  const noSpaces = !/\s/.test(password);

  return (
    lengthCheck &&
    upperCaseCheck &&
    lowerCaseCheck &&
    digitCheck &&
    specialCharCheck &&
    noSpaces
  );
}
  module.exports= {
    isValidPassword
  };