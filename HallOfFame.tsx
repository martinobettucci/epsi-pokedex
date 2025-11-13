// HallOfFame.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { indexedDbService } from './services/indexedDbService';
import { ArchivedGame, MinimonRarity, MinimonStatus, StyleBadge } from './types'; // Import MinimonStatus
import Button from './components/Button';
import { ArrowLeft, Trophy, Gem, Coins, Star, Loader2 } from 'lucide-react';
import Modal from './components/Modal';
import { rarityOrderMap, isValidMinimonRarity } from './utils/gameHelpers'; // Import rarityOrderMap and isValidMinimonRarity
import { certifyScore } from './services/certifyScoreService';
import { useTranslation } from './i18n';

interface HallOfFameProps {
  onBack: () => void;
}

type ShareChannel = 'linkedin' | 'x' | 'facebook' | 'instagram';

const APP_SHARE_LINK = ((): string => {
  const configured = import.meta.env.VITE_APP_PUBLIC_URL?.trim();
  return configured && configured.length > 0
    ? configured.replace(/\/+$/, '')
    : 'https://minimon-deck-game.netlify.app/';
})();
const SHARE_CHANNELS: ShareChannel[] = ['linkedin', 'x', 'facebook', 'instagram'];
const shareUrlBuilders: Record<ShareChannel, (message: string) => string> = {
  linkedin: (message) =>
    `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(APP_SHARE_LINK)}&title=${encodeURIComponent('Minimon Lab')}&summary=${encodeURIComponent(message)}&source=${encodeURIComponent('Minimon Lab')}&text=${encodeURIComponent(message)}`,
  x: (message) =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(APP_SHARE_LINK)}`,
  facebook: (message) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_SHARE_LINK)}&quote=${encodeURIComponent(message)}`,
  instagram: () => 'https://www.instagram.com',
};

const badgeStyles: Record<StyleBadge, string> = {
  Curator: 'bg-amber-300 text-amber-900',
  Flipper: 'bg-slate-200 text-slate-900',
  'Risk-taker': 'bg-rose-500 text-white',
  'Brave run': 'bg-orange-400 text-orange-900',
  'No brainer': 'bg-cyan-300 text-cyan-900',
  'No player': 'bg-slate-600 text-white',
  'Speedy gonzales': 'bg-lime-300 text-lime-900',
};

const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard not available');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!successful) {
    throw new Error('Clipboard not available');
  }
};

const HallOfFame: React.FC<HallOfFameProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [archives, setArchives] = useState<ArchivedGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareSignature, setShareSignature] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copiedShareMessage, setCopiedShareMessage] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToastMessage(message);
    setToastType(type);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const fetchArchives = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedArchives = await indexedDbService.getArchivedGames();
      // Sort archives by date, newest first
      setArchives(fetchedArchives);
    } catch (error) {
      console.error('Failed to fetch archived games:', error);
      // Optionally show an error message
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sortedArchives = useMemo(() => {
    return [...archives].sort((a, b) => b.score - a.score);
  }, [archives]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const getRarityColor = useCallback((rarity: MinimonRarity) => { // Updated type
    // Fallback for styling if rarity is invalid
    const validRarity = isValidMinimonRarity(rarity) ? rarity : MinimonRarity.F;
    switch (validRarity) {
      case MinimonRarity.F: return 'bg-gray-800 text-gray-400';
      case MinimonRarity.E: return 'bg-gray-700 text-gray-300';
      case MinimonRarity.D: return 'bg-blue-900 text-blue-300';
      case MinimonRarity.C: return 'bg-green-900 text-green-300';
      case MinimonRarity.B: return 'bg-purple-900 text-purple-300';
      case MinimonRarity.A: return 'bg-yellow-900 text-yellow-300';
      case MinimonRarity.S: return 'bg-orange-900 text-orange-300';
      case MinimonRarity.S_PLUS: return 'bg-red-900 text-red-300 font-bold';
      default: return 'bg-gray-900 text-gray-400';
    }
  }, []);

  const openArchiveDetails = (archive: ArchivedGame) => {
    setSelectedArchive(archive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArchive(null);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setShareMessage('');
    setShareSignature('');
    setShareError(null);
    setCopiedShareMessage(false);
  };

  const handleCopyShareMessage = async () => {
    if (!shareMessage) return;
    try {
      await copyTextToClipboard(shareMessage);
      setCopiedShareMessage(true);
      setTimeout(() => setCopiedShareMessage(false), 2000);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setShareError(errorText);
      showToast(t('hallOfFame.share.error', { error: errorText }));
    }
  };

  const handleShareAction = async (channel: ShareChannel) => {
    setShareError(null);
    if (!shareMessage) return;
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window not available');
      }
      if (channel === 'instagram') {
        await copyTextToClipboard(shareMessage);
        setCopiedShareMessage(true);
        setTimeout(() => setCopiedShareMessage(false), 2000);
        const shareWindow = window.open(shareUrlBuilders[channel](shareMessage), '_blank', 'noopener');
        shareWindow?.focus();
        return;
      }
      const shareWindow = window.open(shareUrlBuilders[channel](shareMessage), '_blank', 'noopener');
      shareWindow?.focus();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setShareError(errorText);
      showToast(t('hallOfFame.share.error', { error: errorText }));
    }
  };

  const handleShareArchive = async (archive: ArchivedGame) => {
    setShareLoading(true);
    setShareError(null);
    setCopiedShareMessage(false);
    try {
      const response = await certifyScore({
        score: archive.score,
        subject: archive.id,
        deck: archive,
      });
      const badgeLabel =
        (archive.telemetry?.styleBadge && t(`hallOfFame.badges.${archive.telemetry.styleBadge}`)) ||
        archive.telemetry?.styleBadge ||
        t('hallOfFame.badges.Curator');
      const message = t('hallOfFame.share.message', {
        score: archive.score,
        signature: response.signed.signatureB64,
        link: APP_SHARE_LINK,
        badge: badgeLabel,
      });
      setShareMessage(message);
      setShareSignature(response.signed.signatureB64);
      setShareModalOpen(true);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setShareError(errorText);
      showToast(t('hallOfFame.share.error', { error: errorText }));
    } finally {
      setShareLoading(false);
    }
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setResetError(null);
  };

  const handleResetSession = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      await indexedDbService.resetEntireAppData();
      closeResetModal();
      showToast(t('hallOfFame.reset.success'), 'success');
      await fetchArchives();
      onBack();
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setResetError(errorText);
      showToast(t('hallOfFame.reset.error', { error: errorText }));
    } finally {
      setIsResetting(false);
    }
  };

  const sortedMinimonsInArchive = useMemo(() => { // Updated variable
    if (!selectedArchive) return [];
    const minimonsToSort = [...selectedArchive.minimons]; // Updated variable
    // Sort by rarity (descending) then by name (ascending)
    return minimonsToSort.sort((a, b) => {
      // Validate rarity before using it for sorting
      const rarityA = isValidMinimonRarity(a.rarity) ? a.rarity : MinimonRarity.F;
      const rarityB = isValidMinimonRarity(b.rarity) ? b.rarity : MinimonRarity.F;
      const rarityDiff = rarityOrderMap[rarityB] - rarityOrderMap[rarityA];
      if (rarityDiff !== 0) return rarityDiff;
      return a.name.localeCompare(b.name);
    });
  }, [selectedArchive]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen relative z-10">
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} aria-label={t('hallOfFame.backLabel')}>
            <ArrowLeft className="h-6 w-6 text-gray-400 hover:text-indigo-400" />
          </Button>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-fuchsia-400 drop-shadow-lg flex-grow tracking-wide">
            {t('hallOfFame.title')}
          </h1>
          <Button variant="danger" size="sm" onClick={() => setIsResetModalOpen(true)}>
            {t('hallOfFame.reset.button')}
          </Button>
        </div>
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-gray-400">
          {t('hallOfFame.help')}
        </p>
        <div className="flex flex-wrap gap-2 bg-white/5 rounded-2xl px-4 py-3 text-[0.7rem] text-gray-200 shadow-inner border border-white/10">
          {[
            ['🛡️', 'legend.curator'],
            ['⚡', 'legend.flipper'],
            ['🎲', 'legend.risk'],
            ['🔥', 'legend.brave'],
            ['💨', 'legend.speedy'],
            ['⚙️', 'legend.nobrainer'],
            ['🤐', 'legend.noplayer'],
          ].map(([icon, key]) => (
            <span key={key} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              <span aria-hidden="true">{icon}</span>
              {t(`hallOfFame.${key}`)}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-400" />
          <p className="ml-4 text-lg text-gray-300">{t('hallOfFame.loading')}</p>
        </div>
      ) : archives.length === 0 ? (
        <p className="text-center text-gray-400 text-xl py-12 bg-gray-900 rounded-xl shadow-md border border-gray-800">
          {t('hallOfFame.empty')}
        </p>
      ) : (
        <>
          {sortedArchives.length > 0 && (
            <div className="flex flex-col gap-4 mb-6">
              {sortedArchives.slice(0, 3).map((archive, index) => (
                <div
                  key={archive.id}
                  className={`flex flex-col rounded-2xl p-6 shadow-2xl border transition-all duration-200 cursor-pointer ${
                    index === 0
                      ? 'bg-gradient-to-br from-amber-500/25 to-amber-400/10 border-amber-300/60 text-white'
                      : index === 1
                        ? 'bg-gradient-to-br from-slate-200/10 to-slate-900/70 border-slate-200/40 text-white'
                        : 'bg-gradient-to-br from-amber-900/10 to-amber-900/0 border-amber-700/40 text-white'
                  }`}
                  onClick={() => openArchiveDetails(archive)}
                  role="button"
                  tabIndex={0}
                  aria-label={t('hallOfFame.modalTitle', { date: new Date(archive.archiveDate).toLocaleDateString() })}
                >
                <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[0.55rem] uppercase tracking-[0.3em] rounded-full px-2 py-0.5 ${
                        badgeStyles[(archive.telemetry?.styleBadge || 'Curator') as StyleBadge] ?? 'bg-slate-500 text-white'
                      }`}
                    >
                      {archive.telemetry?.styleBadge
                        ? t(`hallOfFame.badges.${archive.telemetry.styleBadge}`)
                        : archive.telemetry?.styleBadge || t('hallOfFame.badges.Curator')}
                    </span>
                    <h3 className="text-3xl font-extrabold tracking-wide">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {t('hallOfFame.detailsBadge')}
                    </h3>
                    <p className="text-xs text-gray-200 mt-1">
                      {t('hallOfFame.archivedOn')} {new Date(archive.archiveDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl font-bold text-amber-200">{archive.score}</span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-widest text-gray-100">
                        {t('hallOfFame.share.proudLabel')}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareArchive(archive);
                        }}
                        disabled={shareLoading}
                        className={`${
                          index < 3 ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''
                        }`}
                      >
                        {shareLoading ? t('hallOfFame.share.processing') : t('hallOfFame.share.buttonLabel')}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-100">
                  <span className="flex items-center gap-1">
                    <Gem className="h-4 w-4 text-lime-300" /> {t('hallOfFame.tokens')} {archive.tokenBalance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-cyan-300" /> {t('hallOfFame.minimon')} {archive.minimons.length}
                  </span>
                </div>
                </div>
              ))}
            </div>
          )}
          {sortedArchives.length > 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedArchives.slice(3).map((archive) => (
                <div
                  key={archive.id}
                  className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hover:border-fuchsia-400 hover:shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  onClick={() => openArchiveDetails(archive)}
                  role="button"
                  tabIndex={0}
                  aria-label={t('hallOfFame.modalTitle', { date: new Date(archive.archiveDate).toLocaleDateString() })}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-md" />
                        {t('hallOfFame.detailsBadge')}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badgeStyles[(archive.telemetry?.styleBadge || 'Curator') as StyleBadge] ?? 'bg-slate-600 text-white'}`}>
                        {archive.telemetry?.styleBadge
                          ? t(`hallOfFame.badges.${archive.telemetry.styleBadge}`)
                          : archive.telemetry?.styleBadge || t('hallOfFame.badges.Curator')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                      <span className="text-lime-300 drop-shadow-sm">{archive.score}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {t('hallOfFame.archivedOn')} {new Date(archive.archiveDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-200">
                      <span className="flex items-center gap-1">
                        <Gem className="h-4 w-4 text-lime-300" /> {t('hallOfFame.tokens')} {archive.tokenBalance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-cyan-300" /> {t('hallOfFame.minimon')} {archive.minimons.length}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800 text-right space-y-2">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openArchiveDetails(archive); }}>
                        {t('hallOfFame.viewDetails')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleShareArchive(archive); }}
                        disabled={shareLoading}
                      >
                        {shareLoading ? t('hallOfFame.share.processing') : t('hallOfFame.share.buttonLabel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedArchive && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={t('hallOfFame.modalTitle', { date: new Date(selectedArchive.archiveDate).toLocaleDateString() })}
          cancelButtonText={t('common.close')}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
              <span className="flex items-center gap-2 text-xl font-bold text-gray-100">
                <Trophy className="h-6 w-6 text-yellow-500" /> {t('hallOfFame.detailsBadge')} <span className="text-lime-300">{selectedArchive.score}</span>
              </span>
              <span className="flex items-center gap-2 text-lg font-semibold text-gray-200">
                <Gem className="h-5 w-5 text-lime-300" /> {t('hallOfFame.tokens')} <span className="text-lime-300">{selectedArchive.tokenBalance}</span>
              </span>
              <span className="text-xs text-gray-400">{t('hallOfFame.scoredBy', { version: selectedArchive.scoredByVersion })}</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mt-6 mb-3">
              {t('hallOfFame.modalCollectionTitle', { count: selectedArchive.minimons.length })}
            </h4>
            {selectedArchive.telemetry && (
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-300 mb-2">
                <div>
                  {t('hallOfFame.telemetry.rolls')}: {selectedArchive.telemetry.rolls}
                </div>
                <div>
                  {t('hallOfFame.telemetry.tokens')}: {selectedArchive.telemetry.tokensSpent}
                </div>
                <div>
                  {t('hallOfFame.telemetry.resells')}: {selectedArchive.telemetry.resellCount}
                </div>
                <div>
                  {t('hallOfFame.telemetry.quickFlips')}: {selectedArchive.telemetry.quickFlipCount}
                </div>
                <div className="col-span-2">
                  {t('hallOfFame.telemetry.duration')}: {selectedArchive.telemetry.sessionDurationSeconds}s
                </div>
              </div>
            )}
            {selectedArchive.minimons.length === 0 ? (
              <p className="text-gray-400">{t('hallOfFame.modalNoMinimon')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {sortedMinimonsInArchive.map((minimon) => ( // Updated variable
                  <div key={minimon.id} className="flex items-center p-3 border border-gray-700 rounded-lg bg-gray-900 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 transition-shadow duration-200">
                    <div className="relative w-16 h-16 rounded-md mr-4 bg-gray-800 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={`data:image/png;base64,${minimon.imageBase64}`}
                        alt={minimon.name} // Updated alt
                        className="object-contain w-full h-full"
                      />
                      {minimon.status === MinimonStatus.RESOLD && ( // Corrected condition
                        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-red-400 text-xs font-bold drop-shadow-lg">
                          {t('main.collection.resold')}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-100">
                        {minimon.name}
                        {minimon.status === MinimonStatus.RESOLD && <span className="italic text-gray-500 ml-2">({t('main.collection.resold')})</span>}
                      </p>
                      {/* Validate rarity for display and styling */}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityColor(minimon.rarity)}`}>
                        {isValidMinimonRarity(minimon.rarity) ? minimon.rarity : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
      {shareModalOpen && (
        <Modal
          isOpen={shareModalOpen}
          onClose={closeShareModal}
          title={t('hallOfFame.share.title')}
          cancelButtonText={t('common.close')}
        >
          <div className="space-y-4">
            <p className="text-gray-200">{t('hallOfFame.share.description')}</p>
            {shareError && (
              <p className="text-sm text-red-400">
                {t('hallOfFame.share.error', { error: shareError })}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-indigo-200">{t('hallOfFame.share.channelLabel')}</p>
              <div className="grid grid-cols-2 gap-2">
                {SHARE_CHANNELS.map((channel) => (
                  <Button
                    key={channel}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleShareAction(channel)}
                    disabled={!shareMessage}
                  >
                    {t(`hallOfFame.share.channels.${channel}`)}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-indigo-400">{t('hallOfFame.share.instructions')}</p>
            <label className="text-sm font-semibold text-gray-300">{t('hallOfFame.share.messageLabel')}</label>
            <textarea
              value={shareMessage}
              readOnly
              wrap="soft"
              className="w-full min-h-[120px] rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-200 resize-none break-words whitespace-pre-wrap"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleCopyShareMessage} disabled={!shareMessage}>
                {t('hallOfFame.share.copyButton')}
              </Button>
              {copiedShareMessage && <span className="text-xs text-lime-300">{t('hallOfFame.share.copied')}</span>}
            </div>
            <p className="text-xs text-gray-500 break-words whitespace-pre-wrap">
              {t('hallOfFame.share.signatureLabel')}: {shareSignature}
            </p>
          </div>
        </Modal>
      )}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={closeResetModal}
          title={t('hallOfFame.reset.title')}
          onConfirm={handleResetSession}
          confirmButtonText={t('hallOfFame.reset.confirm')}
          cancelButtonText={t('common.cancel')}
          confirmButtonVariant="danger"
          isLoading={isResetting}
        >
          <p className="text-sm text-gray-200 leading-relaxed">
            {t('hallOfFame.reset.body')}
          </p>
          <p className="text-xs text-red-400 mt-3">
            {t('hallOfFame.reset.warning')}
          </p>
          {resetError && (
            <p className="text-xs text-red-300 mt-3">
              {t('hallOfFame.reset.error', { error: resetError })}
            </p>
          )}
        </Modal>
      )}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex transform items-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/70 to-white/10 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-lg"
        >
          <span
            className={`mr-3 inline-flex h-2 w-2 rounded-full ${toastType === 'error' ? 'bg-red-400' : 'bg-emerald-400'}`}
          />
          <span className="max-w-xs break-words">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
