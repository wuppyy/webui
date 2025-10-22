const STORAGE_PREFIX = 'owu_folder_access_';

const isBrowser = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

export const getStoredFolderAccessToken = (folderId: string): string | null => {
        if (!isBrowser) {
                return null;
        }

        try {
                return sessionStorage.getItem(`${STORAGE_PREFIX}${folderId}`);
        } catch (error) {
                console.error('Unable to read folder access token', error);
                return null;
        }
};

export const storeFolderAccessToken = (folderId: string, token: string) => {
        if (!isBrowser) {
                return;
        }

        try {
                sessionStorage.setItem(`${STORAGE_PREFIX}${folderId}`, token);
        } catch (error) {
                console.error('Unable to store folder access token', error);
        }
};

export const clearFolderAccessToken = (folderId: string) => {
        if (!isBrowser) {
                return;
        }

        try {
                sessionStorage.removeItem(`${STORAGE_PREFIX}${folderId}`);
        } catch (error) {
                console.error('Unable to clear folder access token', error);
        }
};
