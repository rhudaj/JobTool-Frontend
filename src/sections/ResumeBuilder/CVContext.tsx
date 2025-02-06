import { CV } from 'job-tool-shared-types';
import { createContext } from 'react';
import { CVAction } from './useCVs';

export const CVContext = createContext<CV>(null);
export const CVDispatchContext = createContext<React.Dispatch<CVAction>>(null);