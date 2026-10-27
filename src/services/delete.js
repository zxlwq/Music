import * as api from './api';

/**
 * @param {string} url
 * @param {string} passwordValue
 * @param {(url: string) => void} removeFromPlaylist 同步移除列表并保持在播下标，避免误切歌
 * @param {(url: string, tracks: unknown[]) => void} persistRemoveByUrl
 * @param {unknown[]} tracks
 * @param {(url: string) => void} clearAudioCache
 * @param {(v: boolean) => void} setProgressOpen
 * @param {(v: string) => void} setProgressTitle
 * @param {(v: string) => void} setProgressMessage
 * @param {(v: number) => void} setProgressValue
 * @param {(e: unknown, ctx: string) => void} handleError
 * @param {() => void} loadManifestData
 */
export const executeDelete = async (
  url,
  passwordValue,
  removeFromPlaylist,
  persistRemoveByUrl,
  tracks,
  clearAudioCache,
  setProgressOpen,
  setProgressTitle,
  setProgressMessage,
  setProgressValue,
  handleError,
  loadManifestData,
) => {
  const computeFilePath = (u) => {
    if (!u) return '';
    if (u.startsWith('/public/music/')) return u.replace(/^\//, '');
    if (u.startsWith('/music/')) return `public${u}`.replace(/^\//, '');
    return '';
  };

  setProgressOpen(true);
  setProgressTitle('删除中');
  setProgressMessage('正在从仓库删除文件...');
  setProgressValue(10);

  try {
    let remoteDeleted = false;
    let parsedUrl;
    try {
      parsedUrl = new URL(url, window.location.origin);
    } catch {}

    if (parsedUrl?.origin === window.location.origin && parsedUrl.pathname === '/api/r2') {
      const key = parsedUrl.searchParams.get('key');
      if (!key) throw new Error('R2 曲目链接缺少文件 key');
      setProgressMessage('正在从 R2 存储桶删除文件...');
      await api.deleteR2Track(key, passwordValue);
      remoteDeleted = true;
    } else if (
      parsedUrl?.origin === window.location.origin &&
      parsedUrl.pathname === '/api/webdav/stream'
    ) {
      const path = parsedUrl.searchParams.get('path');
      if (!path) throw new Error('云盘曲目链接缺少文件路径');
      setProgressMessage('正在从 WebDAV 云盘删除文件...');
      await api.deleteWebDAVTrack(path, passwordValue);
      remoteDeleted = true;
    } else if (computeFilePath(url) || parsedUrl?.hostname === 'raw.githubusercontent.com') {
      await api.deleteTrack(computeFilePath(url), url, passwordValue);
      remoteDeleted = true;
    }

    removeFromPlaylist(url);
    persistRemoveByUrl(url, tracks);
    clearAudioCache(url);
    setProgressValue(80);
    setProgressTitle('完成');
    setProgressMessage(
      remoteDeleted ? '已从云端删除并从歌单移除' : '已从本地歌单移除（未删除外部文件）',
    );
    setProgressValue(100);
    return true;
  } catch (e) {
    handleError(e, '删除歌曲');
    setProgressTitle('失败');
    setProgressMessage(e.message || '删除失败');
    loadManifestData();
    return false;
  }
};
