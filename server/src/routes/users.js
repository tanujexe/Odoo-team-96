import { Router } from 'express';
import { listUsers, createUser, updateUser, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

// Strictly require Admin role for user directory, creation & role/employee linking
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
