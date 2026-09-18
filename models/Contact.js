import mongoose from 'mongoose';

const contactSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
            maxLength: [50, 'Name can not be more than 50 characters']
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        phone: {
            type: String,
            required: [true, 'Please add a phone number'],
            maxLength: [20, 'Phone can not be more than 20 characters']
        },
        department: {
            type: String,
            required: [true, 'Please select a department'],
            enum: {
                values: [
                    'Healthcare',
                    'Manufacturing',
                    'Defence Technologies',
                    'Agriculture',
                    'Financial Management',
                    'Life Sciences',
                    'Supply Chain',
                    'Utilities',
                    'TensorixAi for Builders',
                    'Energy & Construction'
                ],
                message: '{VALUE} is not a valid department'
            }
        },
        message: {
            type: String,
            required: [true, 'Please add a message'],
            maxLength: [1000, 'Message can not be more than 1000 characters']
        },
        status: {
            type: String,
            enum: ['New', 'In Progress', 'Resolved'],
            default: 'New'
        },
        emailStatus: {
            type: String,
            enum: ['Sent', 'Failed', 'Not Attempted'],
            default: 'Not Attempted'
        },
        emailError: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;