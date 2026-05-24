const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/uploads/:filename', taskController.downloadFile);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('assignedTo').notEmpty().withMessage('Assignee is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
  ],
  validate,
  taskController.createTask
);

router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  validate,
  taskController.addComment
);

router.post(
  '/:id/attachments',
  upload.array('files', 10),
  taskController.uploadAttachments
);

router.delete('/:id/attachments/:attachmentId', taskController.deleteAttachment);

module.exports = router;
