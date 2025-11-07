import { useState, useEffect } from 'react';
import {
  Form,
  FormField,
  FormSubmitButton,
  Row,
  TextField,
  Button,
  Label,
  Column,
  Icon,
  Loading,
} from '@umami/react-zen';
import { useConfig, useLinkQuery } from '@/components/hooks';
import { useMessages } from '@/components/hooks';
import { RefreshCw } from '@/components/icons';
import { getRandomChars } from '@/lib/generate';
import { useUpdateQuery } from '@/components/hooks/queries/useUpdateQuery';
import { LINKS_URL } from '@/lib/constants';
import { isValidUrl } from '@/lib/url';

const generateId = () => getRandomChars(9);

export function LinkEditForm({
  linkId,
  teamId,
  onSave,
  onClose,
}: {
  linkId?: string;
  teamId?: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending, touch, toast } = useUpdateQuery(
    linkId ? `/links/${linkId}` : '/links',
    {
      id: linkId,
      teamId,
    },
  );
  const { linksUrl } = useConfig();
  const hostUrl = linksUrl || LINKS_URL;
  const { data, isLoading } = useLinkQuery(linkId);
  const [slug, setSlug] = useState(generateId());

  const handleSubmit = async (data: any) => {
    await mutateAsync(data, {
      onSuccess: async () => {
        toast(formatMessage(messages.saved));
        touch('links');
        onSave?.();
        onClose?.();
      },
    });
  };

  const handleSlug = () => {
    const slug = generateId();

    setSlug(slug);

    return slug;
  };

  const checkUrl = (url: string) => {
    if (!isValidUrl(url)) {
      return formatMessage(labels.invalidUrl);
    }
    return true;
  };

  useEffect(() => {
    if (data) {
      setSlug(data.slug);
    } else if (!linkId) {
      // 如果是新建链接,生成新的slug
      setSlug(generateId());
    }
  }, [data, linkId]);

  if (linkId && isLoading) {
    return <Loading placement="absolute" />;
  }

  return (
    <Form
      key={linkId || 'new'}
      onSubmit={handleSubmit}
      error={getErrorMessage(error)}
      defaultValues={{ slug, ...data }}
    >
      {({ setValue, watch }) => (
        <FormContent
          formatMessage={formatMessage}
          labels={labels}
          hostUrl={hostUrl}
          slug={slug}
          setSlug={setSlug}
          setValue={setValue}
          watch={watch}
          checkUrl={checkUrl}
          handleSlug={handleSlug}
          onClose={onClose}
          isPending={isPending}
        />
      )}
    </Form>
  );
}

function FormContent({
  formatMessage,
  labels,
  hostUrl,
  slug,
  setSlug,
  setValue,
  watch,
  checkUrl,
  handleSlug,
  onClose,
  isPending,
}: any) {
  const formSlug = watch('slug');

  useEffect(() => {
    if (formSlug !== undefined && formSlug !== slug) {
      setSlug(formSlug);
    }
  }, [formSlug, slug, setSlug]);

  return (
    <>
      <FormField
        label={formatMessage(labels.name)}
        name="name"
        rules={{ required: formatMessage(labels.required) }}
      >
        <TextField autoComplete="off" autoFocus />
      </FormField>

      <FormField
        label={formatMessage(labels.destinationUrl)}
        name="url"
        rules={{ required: formatMessage(labels.required), validate: checkUrl }}
      >
        <TextField placeholder="https://example.com" autoComplete="off" />
      </FormField>

      <Column>
        <Label>{formatMessage(labels.slug)}</Label>
        <Row alignItems="center" gap>
          <FormField
            name="slug"
            rules={{
              required: formatMessage(labels.required),
            }}
            style={{ flex: 1 }}
          >
            <TextField autoComplete="off" placeholder="custom-slug" />
          </FormField>
          <Button
            variant="quiet"
            onPress={() => {
              const newSlug = handleSlug();
              setValue('slug', newSlug, { shouldDirty: true });
            }}
          >
            <Icon>
              <RefreshCw />
            </Icon>
          </Button>
        </Row>
      </Column>

      <Column>
        <Label>{formatMessage(labels.link)}</Label>
        <TextField
          value={`${hostUrl}/${slug}`}
          autoComplete="off"
          isReadOnly
          allowCopy
          style={{ width: '100%' }}
        />
      </Column>

      <Row justifyContent="flex-end" paddingTop="3" gap="3">
        {onClose && (
          <Button isDisabled={isPending} onPress={onClose}>
            {formatMessage(labels.cancel)}
          </Button>
        )}
        <FormSubmitButton>{formatMessage(labels.save)}</FormSubmitButton>
      </Row>
    </>
  );
}
