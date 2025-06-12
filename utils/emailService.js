const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send contact form email
const sendContactEmail = async (contactData) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Contact Form Submission: ${contactData.subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      <p><strong>Company:</strong> ${contactData.company || 'N/A'}</p>
      <p><strong>Phone:</strong> ${contactData.phone || 'N/A'}</p>
      <p><strong>Subject:</strong> ${contactData.subject}</p>
      <p><strong>Message:</strong> ${contactData.message}</p>
      <p><strong>Budget:</strong> ${contactData.budget || 'N/A'}</p>
      <p><strong>Timeline:</strong> ${contactData.timeline || 'N/A'}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    return false;
  }
};

// Send career application email
const sendCareerEmail = async (careerData) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Career Application: ${careerData.position}`,
    html: `
      <h2>New Career Application</h2>
      <p><strong>Name:</strong> ${careerData.name}</p>
      <p><strong>Email:</strong> ${careerData.email}</p>
      <p><strong>Phone:</strong> ${careerData.phone || 'N/A'}</p>
      <p><strong>Position:</strong> ${careerData.position}</p>
      <p><strong>Experience:</strong> ${careerData.experience}</p>
      <p><strong>Current Company:</strong> ${careerData.currentCompany || 'N/A'}</p>
      <p><strong>Expected Salary:</strong> ${careerData.expectedSalary || 'N/A'}</p>
      <p><strong>Notice Period:</strong> ${careerData.noticePeriod || 'N/A'}</p>
      <p><strong>Cover Letter:</strong> ${careerData.coverLetter || 'N/A'}</p>
    `,
    attachments: [
      {
        filename: 'resume.pdf',
        path: careerData.resume
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending career email:', error);
    return false;
  }
};

module.exports = {
  sendContactEmail,
  sendCareerEmail
}; 