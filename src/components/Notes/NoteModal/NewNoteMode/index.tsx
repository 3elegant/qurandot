/* eslint-disable max-lines */
import React from 'react';

import useTranslation from 'next-translate/useTranslation';
import { useSWRConfig } from 'swr';

import styles from '../NoteModal.module.scss';

import buildFormBuilderFormField from '@/components/FormBuilder/buildFormBuilderFormField';
import buildTranslatedErrorMessageByErrorId from '@/components/FormBuilder/buildTranslatedErrorMessageByErrorId';
import FormBuilder from '@/components/FormBuilder/FormBuilder';
import ShareToQrCheckboxLabel from '@/components/Notes/NoteModal/ShareToQrCheckboxLabel';
import Button from '@/dls/Button/Button';
import { ToastStatus, useToast } from '@/dls/Toast/Toast';
import useMutation from '@/hooks/useMutation';
import { Note } from '@/types/auth/Note';
import ErrorMessageId from '@/types/ErrorMessageId';
import { RuleType } from '@/types/FieldRule';
import { FormFieldType } from '@/types/FormField';
import { addNote as baseAddNote } from '@/utils/auth/api';
import { makeGetNotesByVerseUrl } from '@/utils/auth/apiPaths';
import NoteVisibility from '@/utils/auth/types/Notes/NoteVisibility';
import { logButtonClick } from '@/utils/eventLogger';
import { isVerseKeyWithinRanges } from '@/utils/verse';

const BODY_MIN_LENGTH = 6;
const BODY_MAX_LENGTH = 10000;

const BODY_MIN_VALIDATION_PARAMS = {
  value: BODY_MIN_LENGTH,
};
const BODY_MAX_VALIDATION_PARAMS = {
  value: BODY_MAX_LENGTH,
};

type NoteFormData = {
  body: string;
  isPublic: boolean;
};

type Props = {
  verseKey: string;
};

const NewNoteMode: React.FC<Props> = ({ verseKey }) => {
  const { t } = useTranslation('common');
  const toast = useToast();
  const { mutate, cache } = useSWRConfig();

  const { mutate: addNote, isMutating: isAddingNote } = useMutation<Note, NoteFormData>(
    async ({ body, isPublic }) => {
      return baseAddNote({
        body,
        visibility: isPublic ? NoteVisibility.BOTH : NoteVisibility.PRIVATE,
        ...(verseKey && {
          ranges: [`${verseKey}-${verseKey}`],
        }),
      }) as Promise<Note>;
    },
    {
      onSuccess: (data) => {
        // if publishing the note publicly call failed after saving the note succeeded
        // @ts-ignore
        if (data?.error === true) {
          toast(t('notes:save-publish-failed'), {
            status: ToastStatus.Error,
          });
          // @ts-ignore
          mutateCache([data.note]);
          clearCountCache();
        } else {
          toast(t('notes:save-success'), {
            status: ToastStatus.Success,
          });
          mutateCache([data]);
          clearCountCache();
        }
      },
      onError: () => {
        toast(t('common:error.general'), {
          status: ToastStatus.Error,
        });
      },
    },
  );

  const mutateCache = (data: unknown) => {
    if (verseKey) {
      mutate(makeGetNotesByVerseUrl(verseKey), data);
    }
  };

  const clearCountCache = () => {
    // we need to invalidate one of keys that look like: ['countNotes', notesRange]
    // so that the count is updated
    const keys = [...(cache as any).keys()].filter((key) => {
      if (!key.startsWith('countNotes/')) {
        return false;
      }

      if (verseKey) {
        // check if the note is within the range
        const rangeString = key.replace('countNotes/', '');
        return isVerseKeyWithinRanges(verseKey, rangeString);
      }

      // if we're not on the quran reader page, we can just invalidate all the keys
      return true;
    }) as string[];

    if (keys.length) {
      keys.forEach((key) => {
        cache.delete(key);
        mutate(key);
      });
    }
  };

  const onSubmit = async ({ body, isPublic }: NoteFormData) => {
    logButtonClick('add_note');
    addNote({
      body,
      isPublic,
    });
  };
  return (
    <FormBuilder
      formFields={[
        {
          field: 'body',
          placeholder: t('notes:body-placeholder'),
          rules: [
            {
              type: RuleType.Required,
              errorId: ErrorMessageId.RequiredField,
              value: true,
            },
            {
              ...BODY_MIN_VALIDATION_PARAMS,
              type: RuleType.MinimumLength,
              errorId: ErrorMessageId.MinimumLength,
              errorExtraParams: {
                ...BODY_MIN_VALIDATION_PARAMS,
              },
              errorMessage: buildTranslatedErrorMessageByErrorId(
                ErrorMessageId.MinimumLength,
                'body',
                t,
                {
                  ...BODY_MIN_VALIDATION_PARAMS,
                },
              ),
            },
            {
              ...BODY_MAX_VALIDATION_PARAMS,
              type: RuleType.MaximumLength,
              errorId: ErrorMessageId.MaximumLength,
              errorExtraParams: {
                ...BODY_MAX_VALIDATION_PARAMS,
              },
              errorMessage: buildTranslatedErrorMessageByErrorId(
                ErrorMessageId.MaximumLength,
                'body',
                t,
                {
                  ...BODY_MAX_VALIDATION_PARAMS,
                },
              ),
            },
          ],
          type: FormFieldType.TextArea,
          containerClassName: styles.bodyInput,
          fieldSetLegend: t('notes:note'),
        },
        {
          field: 'isPublic',
          label: <ShareToQrCheckboxLabel />,
          defaultValue: false,
          type: FormFieldType.Checkbox,
        },
      ].map((field) => buildFormBuilderFormField(field, t))}
      onSubmit={onSubmit}
      isSubmitting={isAddingNote}
      renderAction={(props) => (
        <div className={styles.actionContainer}>
          <Button
            htmlType="submit"
            isLoading={props.isLoading}
            isDisabled={props.isLoading}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {t('common:notes.save')}
          </Button>
        </div>
      )}
    />
  );
};

export default NewNoteMode;
