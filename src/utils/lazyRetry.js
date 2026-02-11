import React from 'react';

/**
 * A wrapper for React.lazy that retries the import if it fails.
 * Useful for handling Vercel redeploys where old chunks are deleted.
 */
export const lazyRetry = (componentImport) => {
  return React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // The error is likely due to a new deployment
        window.localStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });
};
