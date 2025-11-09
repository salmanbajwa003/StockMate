import { createContext } from 'react';
import type { AuthContextType } from '../utils/types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

