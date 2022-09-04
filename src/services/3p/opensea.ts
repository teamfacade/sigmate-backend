export const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v1';

type PaymentToken = {
  id: number;
  symbol: string;
  address: string;
  image_url: string;
  name: string;
  decimals: number;
  eth_price: number;
  usd_price: number;
};

type AssetContract = {
  address: string;
  asset_contract_type: string;
  created_date: string;
  name: string;
  nft_version: string;
  opensea_version: string | null;
  owner: number;
  schema_name: string;
  symbol: string;
  total_supply: string; // Number in string
  description: string;
  external_link: string;
  image_url: string | null;
  default_to_fiat: boolean;
  dev_buyer_fee_basis_points: number;
  dev_seller_fee_basis_points: number;
  only_proxied_transfers: boolean;
  opensea_buyer_fee_basis_points: number;
  opensea_seller_fee_basis_points: number;
  buyer_fee_basis_points: number;
  seller_fee_basis_points: number;
  payout_address: string;
};

type CollectionStats = {
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  one_day_average_price: number;
  one_day_difference: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  seven_day_average_price: number;
  seven_day_difference: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
  thirty_day_average_price: number;
  thirty_day_difference: number;
  total_volume: number;
  total_sales: number;
  total_supply: number;
  count: number;
  num_owners: number;
  average_price: number;
  num_reports: number;
  market_cap: number;
  floor_price: number;
};

export interface OpenseaCollectionResponse {
  collection: {
    editors: string[];
    payment_tokens: PaymentToken[];
    primary_asset_contracts: AssetContract[];
    traits: {
      [key: string]: {
        [key: string]: number;
      };
    };
    stats: CollectionStats;
    banner_image_url: string | null;
    chat_url: string | null;
    created_date: string;
    default_to_fiat: boolean;
    description: string | null;
    dev_buyer_fee_basis_points: string;
    dev_seller_fee_basis_points: string;
    discord_url: string | null;
    display_data: {
      card_display_style: string;
    };
    external_url: string;
    featured: boolean;
    featured_image_url: string | null;
    hidden: boolean;
    safelist_request_status: string;
    image_url: string | null;
    is_subject_to_whitelist: boolean;
    large_image_url: string | null;
    medium_username: string | null;
    name: string;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: string;
    opensea_seller_fee_basis_points: string;
    payout_address: string;
    require_email: boolean;
    short_description: string | null;
    slug: string;
    telegram_url: string | null;
    twitter_username: string | null;
    instagram_username: string | null;
    wiki_url: string | null;
    is_nsfw: boolean;
    fees: {
      seller_fees: {
        [key: string]: number;
      };
      opensea_fees: {
        [key: string]: number;
      };
    };
  };
}
