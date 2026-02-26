export const FAQ_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is GasNow?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "GasNow is a free, real-time cryptocurrency gas fee tracker and market analytics dashboard. It provides live Ethereum and Bitcoin gas prices, market cap data, Fear & Greed Index, derivatives insights, trending tokens, and crypto news in one place."
            }
        },
        {
            "@type": "Question",
            "name": "How often is the gas price data updated?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Gas prices are updated every 2 minutes for both Ethereum and Bitcoin networks, ensuring you always have access to current transaction fee estimates."
            }
        },
        {
            "@type": "Question",
            "name": "What is the Fear & Greed Index?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The Fear & Greed Index is a market sentiment indicator ranging from 0 (Extreme Fear) to 100 (Extreme Greed). It helps traders understand overall market sentiment and potential buying or selling opportunities."
            }
        },
        {
            "@type": "Question",
            "name": "What is the Market Stress Index?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "The Market Stress Index (MSI) is a proprietary indicator measuring market structural risk through funding rates, open interest changes, volatility, liquidations, BTC dominance, and stablecoin supply. Scores range from 0 (Low Stress) to 100 (High Stress)."
            }
        },
        {
            "@type": "Question",
            "name": "Is GasNow free to use?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, GasNow is completely free and open-source. There are no premium features or subscription requirements."
            }
        }
    ]
};

export const SOFTWARE_APP_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GasNow Gas Tracker",
    "applicationCategory": "Cryptocurrency Tool",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "850"
    }
};

export const DATASET_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "GasNow Cryptocurrency Gas Prices",
    "description": "Real-time Ethereum and Bitcoin gas/transaction fee data updated every 2 minutes",
    "url": "https://gasnow.tools/",
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "creator": {
        "@type": "Organization",
        "name": "GasNow"
    },
    "temporalCoverage": "2021/..",
    "distribution": {
        "@type": "DataDownload",
        "encodingFormat": "application/json",
        "contentUrl": "https://gasnow.tools/"
    },
    "variableMeasured": [
        {
            "@type": "PropertyValue",
            "name": "Ethereum Gas Price (Gwei)",
            "description": "Current Ethereum network gas price in Gwei"
        },
        {
            "@type": "PropertyValue",
            "name": "Bitcoin Transaction Fee (sat/vB)",
            "description": "Current Bitcoin transaction fee in satoshis per virtual byte"
        }
    ]
};

export const ORGANIZATION_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GasNow",
    "url": "https://gasnow.tools",
    "logo": "https://storage.googleapis.com/gpt-engineer-file-uploads/8GP29eTmvBO0Kqf0CrHfX8Rb2hI3/uploads/1763601546392-favicon.ico.png",
    "description": "Open-source cryptocurrency gas tracker and market analytics platform",
    "sameAs": [
        "https://github.com/gasnow-tools",
        "https://twitter.com/gasnow_tools"
    ]
};

export const BREADCRUMB_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://gasnow.tools/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Gas Fees",
            "item": "https://gasnow.tools/#gas-fees"
        },
        {
            "@type": "ListItem",
            "position": 3,
            "name": "Market Overview",
            "item": "https://gasnow.tools/#market-overview"
        }
    ]
};

export const BITCOIN_CYCLE_DATASET_SCHEMA = {
    "@type": "Dataset",
    "name": "Bitcoin Market Cycle Position",
    "description": "Real-time Bitcoin halving cycle analysis tracking market phases, historical patterns, and predictive modeling based on block height and halving events",
    "url": "https://gasnow.tools/",
    "keywords": ["bitcoin cycle", "halving", "market phase", "crypto analytics"],
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "creator": {
        "@type": "Organization",
        "name": "GasNow"
    },
    "temporalCoverage": "2012/.."
};
