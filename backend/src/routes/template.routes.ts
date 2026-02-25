import { Router } from 'express';
import { createTemplate, getAllTemplates, getTemplateById, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { validate } from '../middleware/validate';
import { createTemplateSchema, updateTemplateSchema, templateIdSchema } from '../validation/template.schemas';

const router = Router();

router.post('/', validate(createTemplateSchema), createTemplate);
router.get('/', getAllTemplates);
router.get('/:id', validate(templateIdSchema), getTemplateById);
router.put('/:id', validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', validate(templateIdSchema), deleteTemplate);

export default router;
