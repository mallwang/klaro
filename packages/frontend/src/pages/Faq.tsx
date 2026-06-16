import { useTranslation } from 'react-i18next';
import { Accordion, Container, Grid, Image, Title } from '@mantine/core';
import faqImage from '../assets/faq-image.svg';
import classes from './Faq.module.css';

/**
 * Represents a single FAQ question/answer pair loaded from the translation catalogue.
 */
interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Renders the FAQ page using the Mantine "faq-with-image" layout.
 *
 * Questions and answers are loaded from the active i18n locale under the `faq.items` key,
 * so content can be updated by editing the translation files without touching this component.
 */
export function Faq() {
  const { t } = useTranslation();
  const title = t('faq.title');
  const raw = t('faq.items', { returnObjects: true });
  const items: FaqEntry[] = Array.isArray(raw) ? (raw as FaqEntry[]) : [];

  return (
    <div className={classes.wrapper}>
      <Container size="lg">
        <Grid id="faq-grid" gutter={50}>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Image src={faqImage} alt="Frequently Asked Questions" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Title order={2} ta="left" className={classes.title}>
              {title}
            </Title>
            <Accordion chevronPosition="right" variant="separated">
              {items.map((entry, index) => (
                <Accordion.Item
                  className={classes.item}
                  value={`item-${index}`}
                  key={entry.question}
                >
                  <Accordion.Control>{entry.question}</Accordion.Control>
                  <Accordion.Panel>{entry.answer}</Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}
