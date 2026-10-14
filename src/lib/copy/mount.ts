import { copyText } from './clipboard';

export function mountCopyButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>('button[data-copy]:not([data-mounted])').forEach((btn) => {
    btn.dataset.mounted = '';
    const label = btn.textContent ?? '';
    const status = btn.closest('[data-copy-scope]')?.querySelector<HTMLElement>('[data-copy-status]');
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy ?? '');
      if (status) status.textContent = ok ? 'Install command copied to the clipboard.' : 'Copy failed. Select the command to copy it.';
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      window.setTimeout(() => { btn.textContent = label; }, 1500);
    });
  });
}
