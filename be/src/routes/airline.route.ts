import { Router } from 'express';
import { getTaxAndFeeController } from '../controllers/airrport.controller';

const router = Router();

router.get('/:airlineId/tax-and-fee', getTaxAndFeeController);

export default router;
