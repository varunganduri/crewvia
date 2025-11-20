const nodemailer = require('nodemailer');

// Create reusable transporter with SSL fix
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5,
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email configuration error:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Send email function
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Email Templates
 */
const emailTemplates = {
  /**
   * Welcome email when candidate registers
   */
  welcomeEmail: (candidateName, targetJobRole) => ({
    subject: 'Welcome to Crewvia Consultancy - Let\'s Get You Hired!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Crewvia Consultancy!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Thank you for registering with Crewvia Consultancy! We're excited to help you achieve your career goals.</p>
            
            <p>We specialize in placing candidates in <strong>${targetJobRole}</strong> positions with top companies.</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>✅ We'll review your profile and optimize your resume</li>
              <li>✅ Submit your applications to relevant companies</li>
              <li>✅ Schedule interviews and prepare you for success</li>
              <li>✅ Support you until you get placed</li>
            </ul>
            
            <p>Our team will contact you shortly with updates on your application status.</p>
            
            <p><strong>Need help?</strong> Feel free to reach out to us anytime.</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Job Placement Support Services</p>
            <p>Email: ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Payment reminder email
   */
  paymentReminder: (candidateName, amount, dueDate, pendingAmount, totalFee) => ({
    subject: '💳 Payment Reminder - Crewvia Consultancy',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #f59e0b; border-radius: 0 0 10px 10px; }
          .payment-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>This is a gentle reminder regarding your pending payment with Crewvia Consultancy.</p>
            
            <div class="payment-box">
              <h3>Payment Details:</h3>
              <table style="width: 100%;">
                <tr>
                  <td><strong>Total Service Fee:</strong></td>
                  <td style="text-align: right;">₹${totalFee}</td>
                </tr>
                <tr>
                  <td><strong>Amount Due:</strong></td>
                  <td style="text-align: right; color: #dc2626; font-size: 18px;"><strong>₹${amount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Due Date:</strong></td>
                  <td style="text-align: right;">${dueDate}</td>
                </tr>
                <tr style="border-top: 2px solid #f59e0b;">
                  <td><strong>Total Pending:</strong></td>
                  <td style="text-align: right; font-size: 20px; color: #dc2626;"><strong>₹${pendingAmount}</strong></td>
                </tr>
              </table>
            </div>
            
            <p>Please make the payment at your earliest convenience to continue receiving our placement services.</p>
            
            <p><strong>Payment can be made via:</strong></p>
            <ul>
              <li>💵 Cash (at our office)</li>
              <li>📱 UPI/PhonePe/Google Pay</li>
              <li>🏦 Bank Transfer</li>
            </ul>
            
            <p>For any queries, please contact us.</p>
            
            <p>Thank you for your cooperation!</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Email: ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Interview reminder email
   */
  interviewReminder: (candidateName, company, role, date, time, location, mode, interviewType) => ({
    subject: `📅 Interview Reminder - ${company} | ${role}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #3b82f6; border-radius: 0 0 10px 10px; }
          .interview-box { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .tips { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Scheduled</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>This is a reminder about your upcoming interview. All the best! 🎯</p>
            
            <div class="interview-box">
              <h3>Interview Details:</h3>
              <table style="width: 100%;">
                <tr>
                  <td><strong>🏢 Company:</strong></td>
                  <td style="text-align: right;"><strong>${company}</strong></td>
                </tr>
                <tr>
                  <td><strong>💼 Position:</strong></td>
                  <td style="text-align: right;">${role}</td>
                </tr>
                <tr>
                  <td><strong>📅 Date:</strong></td>
                  <td style="text-align: right;">${date}</td>
                </tr>
                <tr>
                  <td><strong>🕐 Time:</strong></td>
                  <td style="text-align: right;"><strong style="font-size: 18px; color: #dc2626;">${time}</strong></td>
                </tr>
                <tr>
                  <td><strong>📍 ${mode === 'Online' ? 'Meeting Link' : 'Location'}:</strong></td>
                  <td style="text-align: right;">${location}</td>
                </tr>
                <tr>
                  <td><strong>🎯 Interview Type:</strong></td>
                  <td style="text-align: right;">${interviewType || 'General'}</td>
                </tr>
              </table>
            </div>
            
            <div class="tips">
              <h3>✨ Quick Tips:</h3>
              <ul>
                <li>✅ Arrive 15 minutes early ${mode === 'Online' ? '(join the meeting early)' : ''}</li>
                <li>✅ Carry necessary documents (Resume, ID proof)</li>
                <li>✅ Dress professionally</li>
                <li>✅ Be confident and honest</li>
                <li>✅ Research about the company beforehand</li>
                <li>✅ Prepare answers for common questions</li>
              </ul>
            </div>
            
            <p><strong>Important:</strong> Please confirm your attendance by replying to this email or contacting us.</p>
            
            <p>Wishing you all the best! 🍀</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Email: ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Application submitted confirmation
   */
  applicationSubmitted: (candidateName, company, role, submissionDate) => ({
    subject: `✅ Application Submitted - ${company}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #10b981; border-radius: 0 0 10px 10px; }
          .app-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Submitted Successfully</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Great news! We have successfully submitted your application to <strong>${company}</strong>.</p>
            
            <div class="app-box">
              <h3>Application Details:</h3>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Position:</strong> ${role}</p>
              <p><strong>Submitted On:</strong> ${submissionDate}</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>🔍 The company will review your application</li>
              <li>📞 We'll keep you updated on the status</li>
              <li>📅 If shortlisted, we'll schedule your interview</li>
            </ul>
            
            <p>This process typically takes 3-7 business days. We'll notify you as soon as we hear back from the company.</p>
            
            <p>Keep your phone handy and stay prepared! 💼</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Email: ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * Placement confirmation - Congratulations!
   */
  placementConfirmation: (candidateName, company, role, salary, joiningDate) => ({
    subject: `🎉 Congratulations! You're Placed at ${company}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #10b981; border-radius: 0 0 10px 10px; }
          .congrats-box { background: #ecfdf5; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; text-align: center; }
          .details-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉🎊 CONGRATULATIONS! 🎊🎉</h1>
            <h2>You're Hired!</h2>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <div class="congrats-box">
              <h2 style="color: #10b981; margin: 0;">🌟 YOU DID IT! 🌟</h2>
              <p style="font-size: 18px; margin: 10px 0;">We are thrilled to inform you that you have been selected!</p>
            </div>
            
            <div class="details-box">
              <h3>📋 Job Details:</h3>
              <table style="width: 100%; font-size: 16px;">
                <tr>
                  <td><strong>🏢 Company:</strong></td>
                  <td style="text-align: right;"><strong style="color: #10b981; font-size: 18px;">${company}</strong></td>
                </tr>
                <tr>
                  <td><strong>💼 Position:</strong></td>
                  <td style="text-align: right;">${role}</td>
                </tr>
                <tr>
                  <td><strong>💰 Salary:</strong></td>
                  <td style="text-align: right;"><strong style="color: #10b981; font-size: 18px;">₹${salary}</strong></td>
                </tr>
             <tr>
  <td><strong>📆 Joining Date:</strong></td>
  <td style="text-align: right;">${joiningDate}</td>
</tr>

              </table>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>✅ The company will send you the offer letter soon</li>
              <li>✅ Complete any pending documentation</li>
              <li>✅ Prepare for your joining date</li>
              <li>✅ Contact us for any assistance</li>
            </ul>
            
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>⚠️ Important:</strong> Please complete the remaining payment formalities (if any) with our office.
            </p>
            
            <p style="font-size: 18px; text-align: center; margin: 30px 0;">
              🎯 <strong>Your hard work paid off!</strong> 🎯<br>
              Wishing you all the best in your new role!
            </p>
            
            <p>We're proud to have been part of your success journey! 🚀</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Email: ${process.env.EMAIL_USER}</p>
            <p>Thank you for choosing us!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  // ✅ ADD THIS NEW TEMPLATE
applicationStatusUpdate: (candidateName, companyName, jobRole, oldStatus, newStatus) => {
  // Status-specific messages
  const statusMessages = {
    'Under Review': {
      icon: '🔍',
      message: 'Your application is now being reviewed by the hiring team.',
      color: '#f59e0b'
    },
    'Shortlisted': {
      icon: '⭐',
      message: 'Great news! You have been shortlisted for the next round.',
      color: '#8b5cf6'
    },
    'Interview Scheduled': {
      icon: '📅',
      message: 'Your interview has been scheduled. Check your email for details.',
      color: '#f97316'
    },
    'Offer Extended': {
      icon: '🎉',
      message: 'Congratulations! An offer has been extended to you.',
      color: '#10b981'
    },
    'Offer Accepted': {
      icon: '✅',
      message: 'You have accepted the offer. Welcome to the team!',
      color: '#10b981'
    },
    'Joined': {
      icon: '🎊',
      message: 'Welcome aboard! Your journey with the company has begun.',
      color: '#10b981'
    },
    'Rejected': {
      icon: '❌',
      message: 'Unfortunately, you were not selected for this position. Keep applying!',
      color: '#ef4444'
    },
    'On Hold': {
      icon: '⏸️',
      message: 'Your application is currently on hold. We\'ll update you soon.',
      color: '#6b7280'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    icon: '📢',
    message: 'Your application status has been updated.',
    color: '#3b82f6'
  };

  return {
    subject: `Application Status Update: ${newStatus} - ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .icon { font-size: 48px; margin-bottom: 10px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { background: ${statusInfo.color}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
          .old-status { background: #e5e7eb; color: #6b7280; padding: 8px 16px; border-radius: 20px; display: inline-block; text-decoration: line-through; }
          .info-box { background: white; padding: 20px; border-left: 4px solid ${statusInfo.color}; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${statusInfo.icon}</div>
            <h1 style="margin: 0;">Application Status Updated!</h1>
          </div>
          
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>We have an update regarding your application for the <strong>${jobRole}</strong> position at <strong>${companyName}</strong>.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span class="old-status">${oldStatus}</span>
              <span style="margin: 0 10px; font-size: 20px;">→</span>
              <span class="status-badge">${newStatus}</span>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: ${statusInfo.color};">What This Means:</h3>
              <p style="margin-bottom: 0;">${statusInfo.message}</p>
            </div>
            
            <p><strong>Application Details:</strong></p>
            <ul>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Position:</strong> ${jobRole}</li>
              <li><strong>Current Status:</strong> ${newStatus}</li>
              <li><strong>Updated:</strong> ${new Date().toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</li>
            </ul>
            
            ${newStatus === 'Interview Scheduled' ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📅 Next Steps:</strong> Please check your email for interview details including date, time, and location.</p>
              </div>
            ` : ''}
            
            ${newStatus === 'Offer Extended' ? `
              <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>🎉 Congratulations!</strong> Please review the offer letter sent to your email and respond at your earliest convenience.</p>
              </div>
            ` : ''}
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Crewvia Consultancy. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
},


  /**
   * Payment receipt confirmation
   */
  paymentReceipt: (candidateName, amount, paymentDate, paymentMode, transactionId, balance) => ({
    subject: '✅ Payment Received - Crewvia Consultancy',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 2px solid #10b981; border-radius: 0 0 10px 10px; }
          .receipt-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #10b981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Thank you! We have received your payment successfully.</p>
            
            <div class="receipt-box">
              <h3 style="text-align: center; color: #10b981;">PAYMENT RECEIPT</h3>
              <table style="width: 100%; margin-top: 20px;">
                <tr>
                  <td><strong>Amount Paid:</strong></td>
                  <td style="text-align: right; color: #10b981; font-size: 20px;"><strong>₹${amount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Payment Date:</strong></td>
                  <td style="text-align: right;">${paymentDate}</td>
                </tr>
                <tr>
                  <td><strong>Payment Mode:</strong></td>
                  <td style="text-align: right;">${paymentMode}</td>
                </tr>
                ${transactionId ? `<tr>
                  <td><strong>Transaction ID:</strong></td>
                  <td style="text-align: right;"><code>${transactionId}</code></td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #10b981;">
                  <td><strong>Remaining Balance:</strong></td>
                  <td style="text-align: right; font-size: 18px;"><strong>₹${balance}</strong></td>
                </tr>
              </table>
            </div>
            
            ${balance > 0 ? `
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px;">
              <strong>Note:</strong> Your remaining balance is ₹${balance}. Please clear it at your earliest convenience.
            </p>
            ` : `
            <p style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
              🎉 <strong>All payments cleared! Thank you!</strong> 🎉
            </p>
            `}
            
            <p>For any queries regarding this payment, please contact us.</p>
            
            <p>Best regards,<br><strong>Crewvia Consultancy Team</strong></p>
          </div>
          <div class="footer">
            <p>Crewvia Consultancy | Email: ${process.env.EMAIL_USER}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
