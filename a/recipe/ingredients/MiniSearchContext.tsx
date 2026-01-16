import { createContext, useContext } from 'react';

// Create context for MiniSearch instance
export const MiniSearchContext = createContext<any>(null);

export const useMiniSearch = () => {
	return useContext(MiniSearchContext);
};