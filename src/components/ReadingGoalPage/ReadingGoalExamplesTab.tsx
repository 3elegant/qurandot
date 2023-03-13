import useTranslation from 'next-translate/useTranslation';

import OptionButton from './OptionButton';
import styles from './ReadingGoalPage.module.scss';
import { readingGoalExamples, ReadingGoalTabProps } from './useReadingGoalReducer';

const ReadingGoalExamplesTab: React.FC<ReadingGoalTabProps> = ({ state, dispatch, nav }) => {
  const { t } = useTranslation('reading-goal');

  return (
    <>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>{t('examples-title')}</h1>
        <p className={styles.subtitle}>{t('examples-subtitle')}</p>
      </div>
      <div className={styles.optionsContainer}>
        {Object.values(readingGoalExamples).map((example) => (
          <OptionButton
            key={example.i18nKey}
            icon={example.icon}
            onSelect={() => {
              dispatch({ type: 'SET_EXAMPLE', payload: { exampleKey: example.i18nKey } });
            }}
            selected={state.exampleKey === example.i18nKey}
            option={t(`examples.${example.i18nKey}.title`)}
            recommended={'recommended' in example && example.recommended}
            description={t(`examples.${example.i18nKey}.description`)}
          />
        ))}
        {nav}
      </div>
    </>
  );
};

export default ReadingGoalExamplesTab;
