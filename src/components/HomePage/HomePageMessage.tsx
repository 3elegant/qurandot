import React from 'react';

import useTranslation from 'next-translate/useTranslation';

import styles from './HomePageMessage.module.scss';

import Button, { ButtonShape, ButtonSize, ButtonVariant } from '@/dls/Button/Button';
import CloseIcon from '@/icons/close.svg';
import { makeDonateUrl } from '@/utils/apiPaths';
import { logEvent } from '@/utils/eventLogger';

type HomePageMessageProps = {
  title?: string;
  subtitle?: string;
  body?: React.ReactNode;
  onClose?: () => void;
};

const HomePageMessage = ({ title, subtitle, body, onClose }: HomePageMessageProps) => {
  const { t } = useTranslation('common');
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{subtitle}</p>
      {body}

      <div className={styles.closeIcon}>
        <Button
          size={ButtonSize.Small}
          shape={ButtonShape.Circle}
          variant={ButtonVariant.Ghost}
          onClick={onClose}
          ariaLabel={t('aria.msg-close')}
        >
          <CloseIcon />
        </Button>
      </div>
      <div className={styles.ctaContainer}>
        <Button
          isNewTab
          href={makeDonateUrl(true)}
          onClick={() => {
            logEvent('donate_button_clicked', {
              source: 'cta_welcome_message',
            });
          }}
          className={styles.ctaPrimary}
          size={ButtonSize.Small}
          variant={ButtonVariant.Shadow}
        >
          {t('fundraising-sticky-banner.cta')}
        </Button>

        <Button
          isNewTab
          href="https://donate.quran.com"
          onClick={() => {
            logEvent('donate_button_clicked', {
              source: 'learn_more_welcome_message',
            });
          }}
          variant={ButtonVariant.Compact}
        >
          {t('fundraising.learn-more')}
        </Button>
      </div>
    </div>
  );
};

export default HomePageMessage;
