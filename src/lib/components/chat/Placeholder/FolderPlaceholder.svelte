<script>
        import { getContext } from 'svelte';
	const i18n = getContext('i18n');

        import ChatList from './ChatList.svelte';
        import FolderKnowledge from './FolderKnowledge.svelte';
        import Spinner from '$lib/components/common/Spinner.svelte';
        import { toast } from 'svelte-sonner';
        import { getChatListByFolderId } from '$lib/apis/chats';
        import { unlockFolder } from '$lib/apis/folders';
        import {
                getStoredFolderAccessToken,
                storeFolderAccessToken,
                clearFolderAccessToken
        } from '$lib/utils/folderAccess';

	export let folder = null;

	let selectedTab = 'chats';

        let chats = null;
        let page = 1;
        let passwordInput = '';
        let unlocking = false;
        let unlockError = '';
        let unlocked = false;

        const mapUnlockMessage = (message: string) => {
                if (!message) {
                        return '';
                }

                const normalized = message.toLowerCase();

                if (normalized.includes('incorrect folder password')) {
                        return $i18n.t('Incorrect folder password.');
                }

                if (normalized.includes('folder access requires') || normalized.includes('invalid folder access token')) {
                        return $i18n.t('Folder access requires a valid password.');
                }

                return message;
        };

        const setChatList = async () => {
                chats = null;

                if (folder && folder.id) {
                        const requiresPassword = folder?.meta?.password_protected ?? false;
                        const accessToken = getStoredFolderAccessToken(folder.id);

                        if (requiresPassword && !accessToken) {
                                unlocked = false;
                                chats = [];
                                return;
                        }

                        try {
                                const res = await getChatListByFolderId(
                                        localStorage.token,
                                        folder.id,
                                        page,
                                        accessToken
                                );

                                chats = res ?? [];
                                unlocked = true;
                                unlockError = '';
                        } catch (error) {
                                const message =
                                        typeof error === 'string'
                                                ? error
                                                : error?.detail ?? `${error}`;

                                if (requiresPassword) {
                                        clearFolderAccessToken(folder.id);
                                        unlocked = false;
                                        unlockError = mapUnlockMessage(message);
                                        chats = [];
                                } else {
                                        toast.error(message);
                                        chats = [];
                                }
                        }
                } else {
                        chats = [];
                }
        };

        const unlockHandler = async () => {
                if (!folder?.id) {
                        return;
                }

                if (passwordInput.trim() === '') {
                        unlockError = $i18n.t('Password cannot be empty.');
                        return;
                }

                unlocking = true;
                unlockError = '';

                try {
                        const res = await unlockFolder(localStorage.token, folder.id, passwordInput.trim());
                        if (res?.access_token) {
                                storeFolderAccessToken(folder.id, res.access_token);
                                passwordInput = '';
                                unlocked = true;
                                await setChatList();
                        }
                } catch (error) {
                        const message =
                                typeof error === 'string'
                                        ? error
                                        : error?.detail ?? `${error}`;

                        unlockError = mapUnlockMessage(message);
                        clearFolderAccessToken(folder.id);
                        unlocked = false;
                } finally {
                        unlocking = false;
                }
        };

        $: if (folder) {
                passwordInput = '';
                unlockError = '';
                setChatList();
        }
</script>

<div>
	<!-- <div class="mb-1">
		<div
			class="flex gap-1 scrollbar-none overflow-x-auto w-fit text-center text-sm font-medium rounded-full bg-transparent py-1 touch-auto pointer-events-auto"
		>
			<button
				class="min-w-fit p-1.5 {selectedTab === 'knowledge'
					? ''
					: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
				type="button"
				on:click={() => {
					selectedTab = 'knowledge';
				}}>{$i18n.t('Knowledge')}</button
			>

			<button
				class="min-w-fit p-1.5 {selectedTab === 'chats'
					? ''
					: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
				type="button"
				on:click={() => {
					selectedTab = 'chats';
				}}
			>
				{$i18n.t('Chats')}
			</button>
		</div>
	</div> -->

        <div class="">
                {#if folder?.meta?.password_protected && !unlocked}
                        <form
                                class="max-w-md mx-auto flex flex-col space-y-3 bg-gray-50/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                                on:submit|preventDefault={() => {
                                        unlockHandler();
                                }}
                        >
                                <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {$i18n.t('This folder is password protected.')}
                                </div>
                                {#if folder?.meta?.password_hint}
                                        <div class="text-xs text-gray-500 dark:text-gray-400">
                                                {$i18n.t('Password Hint')}: {folder.meta.password_hint}
                                        </div>
                                {/if}

                                <div class="flex flex-col">
                                        <label class="mb-1 text-xs text-gray-500" for="folder-password-input">
                                                {$i18n.t('Folder Password')}
                                        </label>
                                        <input
                                                id="folder-password-input"
                                                class="w-full text-sm bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-700 outline-hidden border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                                                type="password"
                                                bind:value={passwordInput}
                                                placeholder="********"
                                                autocomplete="off"
                                        />
                                </div>

                                {#if unlockError}
                                        <div class="text-xs text-red-500 dark:text-red-400">{unlockError}</div>
                                {/if}

                                <button
                                        class="self-start inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-60"
                                        type="submit"
                                        disabled={unlocking}
                                >
                                        {$i18n.t('Unlock Folder')}

                                        {#if unlocking}
                                                <Spinner className="size-4" />
                                        {/if}
                                </button>
                        </form>
                {:else if selectedTab === 'knowledge'}
                        <FolderKnowledge />
                {:else if selectedTab === 'chats'}
                        {#if chats !== null}
                                <ChatList {chats} />
                        {:else}
                                <div class="py-10">
                                        <Spinner />
                                </div>
                        {/if}
                {/if}
        </div>
</div>
