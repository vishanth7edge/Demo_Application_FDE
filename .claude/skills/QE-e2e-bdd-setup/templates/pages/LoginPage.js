const { BasePage } = require('./BasePage');

// TODO: adapt locators and the flow (OTP step, SSO, etc.) to the target app.
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /log ?in|sign ?in/i });
    this.otpInput = page.getByLabel(/otp|code/i);
  }

  async goto() {
    await this.navigate('/login');
  }

  async login(email, password, otp) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    if (otp) {
      await this.otpInput.fill(otp);
      await this.submitButton.click();
    }
  }
}

module.exports = { LoginPage };
