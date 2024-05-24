import { AppPlugin } from '@grafana/data';
import { registerExtensions } from '../utils';

export default registerExtensions(new AppPlugin());
