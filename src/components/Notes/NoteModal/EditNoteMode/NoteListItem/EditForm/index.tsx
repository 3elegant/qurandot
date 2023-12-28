/* eslint-disable max-lines */
import React, { useState } from 'react';

import useTranslation from 'next-translate/useTranslation';
import { useSWRConfig } from 'swr';

import buildFormBuilderFormField from '@/components/FormBuilder/buildFormBuilderFormField';
import buildTranslatedErrorMessageByErrorId from '@/components/FormBuilder/buildTranslatedErrorMessageByErrorId';
import FormBuilder from '@/components/FormBuilder/FormBuilder';
import styles from '@/components/Notes/NoteModal/NoteModal.module.scss';
import Button, { ButtonVariant } from '@/dls/Button/Button';
import { ToastStatus, useToast } from '@/dls/Toast/Toast';
import useMutation from '@/hooks/useMutation';
import { Note, NoteReference } from '@/types/auth/Note';
import ErrorMessageId from '@/types/ErrorMessageId';
import { RuleType } from '@/types/FieldRule';
import { FormFieldType } from '@/types/FormField';
import { updateNote as baseUpdateNote } from '@/utils/auth/api';
import { makeGetNoteByIdUrl, makeGetNotesByVerseUrl } from '@/utils/auth/apiPaths';
import { logButtonClick } from '@/utils/eventLogger';

type Props = {
  note: Note;
  onNoteUpdated?: (data: Note) => void;
  onCancelEditClicked: () => void;
  verseKey?: string;
  noteId?: string;
};

type NoteFormData = {
  body: string;
};

const BODY_MIN_LENGTH = 6;
const BODY_MAX_LENGTH = 10000;
const BODY_MIN_VALIDATION_PARAMS = {
  value: BODY_MIN_LENGTH,
};
const BODY_MAX_VALIDATION_PARAMS = {
  value: BODY_MAX_LENGTH,
};

const EditForm: React.FC<Props> = ({
  note,
  onNoteUpdated,
  verseKey,
  noteId,
  onCancelEditClicked,
}) => {
  const { t } = useTranslation('common');
  const [isPublicReflection, setIsPublicReflection] = useState(false);
  const toast = useToast();
  const { mutate } = useSWRConfig();

  const mutateCache = (data: unknown) => {
    if (verseKey) {
      mutate(makeGetNotesByVerseUrl(verseKey), data);
    }

    if (noteId) {
      mutate(makeGetNoteByIdUrl(noteId), data);
    }
  };

  const { mutate: updateNote, isMutating: isUpdatingNote } = useMutation<
    Note,
    { id: string; body: string; references: NoteReference[] }
  >(
    async ({ id, body, references }) => {
      return baseUpdateNote(id, body, isPublicReflection, references) as Promise<Note>;
    },
    {
      onSuccess: (data) => {
        toast(t('notes:update-success'), {
          status: ToastStatus.Success,
        });
        onNoteUpdated?.(data);
        mutateCache([data]);
      },
      onError: () => {
        toast(t('common:error.general'), {
          status: ToastStatus.Error,
        });
      },
    },
  );

  const onSubmit = async ({ body }: NoteFormData) => {
    logButtonClick('update_note', {
      isPublicReflection,
    });
    updateNote({ id: note.id, body, references: note.references });
  };

  return (
    <FormBuilder
      formFields={[
        {
          field: 'body',
          placeholder: t('notes:body-placeholder'),
          defaultValue: note.body,
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
      ].map((field) => buildFormBuilderFormField(field, t))}
      onSubmit={onSubmit}
      isSubmitting={isUpdatingNote}
      renderAction={({ isLoading }) => {
        return (
          <div className={styles.editFormButtons}>
            <Button
              isLoading={isLoading}
              variant={ButtonVariant.Outlined}
              isDisabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onCancelEditClicked();
              }}
            >
              {t('cancel')}
            </Button>
            <div>
              <Button
                htmlType="submit"
                isLoading={isLoading}
                isDisabled={isLoading}
                className={styles.saveButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPublicReflection(false);
                }}
              >
                {t('common:notes.save')}
              </Button>
              <Button
                htmlType="submit"
                isLoading={isLoading}
                isDisabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPublicReflection(true);
                }}
              >
                {t('notes:save-and-share')}
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
};

export default EditForm;
