import express from 'express';
import {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact
} from '../controllers/contactController.js';

const router = express.Router();

router.route('/')
    .post(createContact)
    .get(getContacts);

router.route('/:id')
    .get(getContactById)
    .delete(deleteContact);

router.route('/:id/status')
    .put(updateContactStatus);

export default router;
