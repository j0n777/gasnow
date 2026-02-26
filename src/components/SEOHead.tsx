import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: any;
}

export const SEOHead: React.FC<SEOHeadProps> = (props) => {
  const { t } = useTranslation();

  const {
    title = t('metadata.title'),
    description = t('metadata.description'),
    image = 'https://storage.googleapis.com/gpt-engineer-file-uploads/8GP29eTmvBO0Kqf0CrHfX8Rb2hI3/social-images/social-1763601573739-gasnow perfil.png',
    url = 'https://gasnow.tools/',
    type = 'website',
    schema
  } = props;

  // Avoid double branding if title already contains it
  const siteTitle = title.includes('GasNow') ? title : `${title} | GasNow`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="GasNow" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content="@gasnow_tools" />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
