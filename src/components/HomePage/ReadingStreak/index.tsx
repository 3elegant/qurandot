/* eslint-disable max-lines */
import { useContext, useMemo } from 'react';

import classNames from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import CurrentWeekProgress from './CurrentWeekProgress';
import LoggedOutReadingStreak from './LoggedOutReadingStreak';
import styles from './ReadingStreak.module.scss';

import DataContext from '@/contexts/DataContext';
import Button, { ButtonVariant } from '@/dls/Button/Button';
import HelperTooltip from '@/dls/HelperTooltip/HelperTooltip';
import Link, { LinkVariant } from '@/dls/Link/Link';
import Progress from '@/dls/Progress';
import Skeleton from '@/dls/Skeleton/Skeleton';
import useGetRecentlyReadVerseKeys from '@/hooks/auth/useGetRecentlyReadVerseKeys';
import useGetStreakWithMetadata from '@/hooks/auth/useGetStreakWithMetadata';
import MoonIllustrationSVG from '@/public/images/moon-illustration.svg';
import { ReadingGoalType } from '@/types/auth/ReadingGoal';
import { isLoggedIn } from '@/utils/auth/login';
import { getChapterData } from '@/utils/chapter';
import { secondsToReadableFormat } from '@/utils/datetime';
import { toLocalizedNumber } from '@/utils/locale';
import {
  getChapterWithStartingVerseUrl,
  getReadingGoalNavigationUrl,
  getReadingGoalProgressNavigationUrl,
} from '@/utils/navigation';
import { convertFractionToPercent } from '@/utils/number';
import { parseVerseRange } from '@/utils/verseKeys';

export enum ReadingStreakLayout {
  Home = 'home',
  QuranReader = 'quran-reader',
}

interface ReadingStreakProps {
  layout?: ReadingStreakLayout;
}

const ReadingStreak: React.FC<ReadingStreakProps> = ({ layout = ReadingStreakLayout.Home }) => {
  const { t, lang } = useTranslation('reading-goal');
  const chaptersData = useContext(DataContext);

  const { isLoading, error, streak, readingGoal, weekData } = useGetStreakWithMetadata();
  const { recentlyReadVerseKeys } = useGetRecentlyReadVerseKeys();

  const isQuranReader = layout === ReadingStreakLayout.QuranReader;
  const nextVerseToRead = useMemo(() => {
    const nextVerseToReadFromGoal = readingGoal?.progress?.nextVerseToRead;
    return nextVerseToReadFromGoal ?? recentlyReadVerseKeys[0];
  }, [readingGoal?.progress?.nextVerseToRead, recentlyReadVerseKeys]);

  const localizedStreak = useMemo(() => {
    return toLocalizedNumber(streak, lang);
  }, [streak, lang]);

  const currentReadingDay = useMemo(() => {
    return weekData.readingDaysMap[weekData.days.find((d) => d.current)?.date];
  }, [weekData]);

  const percent = useMemo(() => {
    return convertFractionToPercent(currentReadingDay?.progress || 0);
  }, [currentReadingDay]);

  const localizedPercent = useMemo(() => {
    return toLocalizedNumber(percent, lang);
  }, [percent, lang]);

  const isGoalDone = percent >= 100;
  const hasUserReadToday = (isQuranReader && !isGoalDone) || currentReadingDay?.hasRead;

  const streakUI = (
    <p
      className={classNames(
        styles.streakTitle,
        !hasUserReadToday && streak > 0 && styles.streakTitleWarning,
      )}
    >
      {t('streak', { days: localizedStreak })}
      <HelperTooltip>{t('streak-definition')}</HelperTooltip>
    </p>
  );

  // eslint-disable-next-line react-func/max-lines-per-function
  const getAmountLeftMessage = () => {
    if (!readingGoal || !readingGoal.progress) return null;

    const { progress, type: goalType } = readingGoal;

    const prefix = percent === 0 ? t('todays-goal') : t('remaining');

    let action: string | React.ReactNode = '';

    if (goalType === ReadingGoalType.TIME) {
      action = t('progress.time-goal', {
        time: secondsToReadableFormat(progress.amountLeft, t, lang),
      });
    }

    if (goalType === ReadingGoalType.PAGES) {
      action = t('progress.pages-goal', { pages: progress.amountLeft.toFixed(1) });
    }

    if (goalType === ReadingGoalType.RANGE) {
      const all = [];

      currentReadingDay?.dailyTargetRanges?.forEach((range) => {
        const [
          { chapter: fromChapter, verse: fromVerse, verseKey: rangeFrom },
          { chapter: toChapter, verse: toVerse, verseKey: rangeTo },
        ] = parseVerseRange(range);

        const from = `${
          getChapterData(chaptersData, fromChapter).transliteratedName
        } ${toLocalizedNumber(Number(fromVerse), lang)}`;

        const to = `${
          getChapterData(chaptersData, toChapter).transliteratedName
        } ${toLocalizedNumber(Number(toVerse), lang)}`;

        all.push(
          <>
            <Link href={getChapterWithStartingVerseUrl(rangeFrom)} variant={LinkVariant.Blend}>
              {from}
            </Link>
            {` ${t('common:to')} `}
            <Link href={getChapterWithStartingVerseUrl(rangeTo)} variant={LinkVariant.Blend}>
              {to}
            </Link>
          </>,
        );
      });

      action =
        all.length > 1 ? (
          <ul>
            {all.map((range, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={idx}>{range}</div>
            ))}
          </ul>
        ) : (
          all
        );
    }

    return (
      <>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {prefix}: {action}
        {typeof readingGoal.progress.daysLeft !== 'undefined' && (
          <>
            <br />
            {t('remaining-days', {
              count: readingGoal.progress.daysLeft,
              days: toLocalizedNumber(readingGoal.progress.daysLeft, lang),
            })}
          </>
        )}
      </>
    );
  };

  const getGoalStatus = () => {
    if (!readingGoal) return null;

    if (percent < 100) {
      return getAmountLeftMessage();
    }

    return t('progress.complete');
  };

  if (error || !isLoggedIn()) {
    return <LoggedOutReadingStreak />;
  }

  const getContent = () => {
    if (!isQuranReader) {
      return (
        <>
          <div>
            <span className={styles.streakSubtitle}>{t('reading-goal-label')}</span>
            {isLoading ? <Skeleton>{streakUI}</Skeleton> : streakUI}
          </div>
          <CurrentWeekProgress weekData={weekData} />
        </>
      );
    }

    if (!isGoalDone) {
      return (
        <div className={styles.dailyProgressContainer}>
          <p className={styles.streakTitle}>{t('daily-progress')}</p>
          <p className={styles.dailyGoal}>{getAmountLeftMessage()}</p>
          <div className={styles.progressContainer}>
            <Progress value={percent} />
            <div className={styles.progressTextContainer}>
              <p>{localizedPercent}%</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={styles.dailyProgressContainer}>
          <p className={styles.streakTitle}>{t('goal-done.title')}</p>
          <p className={styles.dailyGoal}>{t('goal-done.description')}</p>
        </div>
        <CurrentWeekProgress weekData={weekData} />
      </>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.illustrationContainer}>
        <MoonIllustrationSVG />
      </div>

      <div className={styles.container}>{getContent()}</div>

      {!isQuranReader && (
        <div className={styles.goalContainer}>
          {!readingGoal ? (
            <Button href={getReadingGoalNavigationUrl()}>{t('create-reading-goal')}</Button>
          ) : (
            getGoalStatus()
          )}
        </div>
      )}

      {/* Render these buttons only if this is not in the QuranReader && there is a reading goal  */}
      {!isQuranReader && readingGoal ? (
        <div className={styles.actionsContainer}>
          <Button
            href={nextVerseToRead ? getChapterWithStartingVerseUrl(nextVerseToRead) : undefined}
            isDisabled={!nextVerseToRead}
          >
            {t('continue-reading')}
          </Button>
          <Button variant={ButtonVariant.Ghost} href={getReadingGoalProgressNavigationUrl()}>
            {t('view-progress')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ReadingStreak;
