const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const { options } = require('../routes/tourRoutes');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Manish darmal <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME, // dUMMY DATA IN HERE
          pass: process.env.SENDGRID_PASSWORD, // DUMMY DATA IN HERE NO REAL ACC
        },
      });
    }

    return nodemailer.createTransport({
      // service: "Gmail",
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      filename: this.firstName,
      url: this.url,
      subject,
    });
    // 2 Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.convert(html, { wordwrap: 130 }),
      // html:
    };

    // 3) Create a trasport and send
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the natours family!');
  }

  async SendPassReset() {
    await this.send(
      'PasswordReset',
      'Your password reset token (Valid for only 10 min)'
    );
  }
};
