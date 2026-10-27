import { Router } from 'express';
import {getAirportController} from '../controllers/airrport.controller';

const router = Router();

router.get('/', getAirportController);

export default router;