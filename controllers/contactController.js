import Contact from '../models/Contact.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create a new contact message
// @route   POST /api/contacts
// @access  Public
export const createContact = async (req, res, next) => {
    try {
        const { name, email, phone, department, message } = req.body;
        console.log(`[ContactController] Incoming request from: ${email}, Phone: ${phone}, Department: ${department}`);

        // Note: This relies on MongoDB to be connected. If it isn't, this will throw
        // an error and drop down to the catch block preventing the email from sending.
        let contact;
        let dbConnected = true;
        try {
            contact = await Contact.create({
                name,
                email,
                phone,
                department,
                message
            });
        } catch (dbError) {
            console.error('[ContactController] Database save failed, proceeding with email anyway:', dbError.message);
            dbConnected = false;
            // We set a mock contact for the API return so the user still gets a success response
            contact = { name, email, phone, department, message, _id: 'db-offline' };
        }

        console.log(`[ContactController] Contact saved/mocked. Preparing to send email to: ${process.env.ADMIN_EMAIL || 'info@rigidfab.com'}`);

        // Email Configuration: Send to Admin
        const emailContent = `
You have received a new contact submission from the Tensorix AI Website.

Name: ${name}
Email: ${email}
Phone: ${phone}
Department: ${department}

Message:
${message}
`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #EA580C;">New Contact Submission</h2>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Department:</strong> ${department}</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 10px;">
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                </div>
                <hr>
                <p style="font-size: 12px; color: #777;">This email was sent automatically from the Tensorix AI Website.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: process.env.ADMIN_EMAIL || 'info@rigidfab.com',
                replyTo: email, // Admin can click 'Reply' to talk to the user directly
                subject: `[${department}] New Contact Request from ${name}`,
                message: emailContent,
                html: htmlContent
            });

            console.log(`[ContactController] Email sent successfully to ${process.env.ADMIN_EMAIL || 'info@rigidfab.com'}`);

            // Mark this record as successfully emailed, if it's a real DB record
            if (dbConnected) {
                contact.emailStatus = 'Sent';
                contact.emailError = null;
                await contact.save();
            }

            res.status(201).json({
                success: true,
                message: 'Email sent successfully',
                data: contact
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);

            // Even though the email failed, keep the submission in the database
            // marked as Failed — so nothing is silently lost, and it's visible
            // in Atlas for you to follow up on manually.
            if (dbConnected) {
                contact.emailStatus = 'Failed';
                contact.emailError = emailError.message;
                await contact.save();
            }

            return next(new Error('Email could not be sent.'));
        }

    } catch (error) {
        next(error);
    }
};

// @desc    Get all contact messages
// @route   GET /api/contacts
// @access  Private
export const getContacts = async (req, res, next) => {
    try {
        // Optional query filter: /api/contacts?emailStatus=Failed
        const filter = {};
        if (req.query.emailStatus) {
            filter.emailStatus = req.query.emailStatus;
        }

        const contacts = await Contact.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single contact message
// @route   GET /api/contacts/:id
// @access  Private
export const getContactById = async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            res.status(404);
            throw new Error('Contact message not found');
        }

        res.status(200).json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update contact status
// @route   PUT /api/contacts/:id/status
// @access  Private
export const updateContactStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        let contact = await Contact.findById(req.params.id);

        if (!contact) {
            res.status(404);
            throw new Error('Contact message not found');
        }

        contact.status = status;
        const updatedContact = await contact.save();

        res.status(200).json({
            success: true,
            data: updatedContact
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete contact message
// @route   DELETE /api/contacts/:id
// @access  Private
export const deleteContact = async (req, res, next) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            res.status(404);
            throw new Error('Contact message not found');
        }

        await contact.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};