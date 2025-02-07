import { createContext } from 'react';
import { CVAction } from './useCV';
import { CV } from 'job-tool-shared-types';

export const CVContext = createContext<CV>(null);
export const CVDispatchContext = createContext<React.Dispatch<CVAction>>(null);
