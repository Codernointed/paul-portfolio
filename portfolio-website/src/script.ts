import './style.css';
import { inject } from '@vercel/analytics';

import Application from './Application/Application';

inject();

const app: Application = new Application();
