import { AppPlugin } from '@grafana/data';
import { registerExtensions } from '../utils';

export const plugin = registerExtensions(new AppPlugin());
