export type ListingStatus =
  | "Active"
  | "Needs Attention"
  | "Draft";

export type Listing = {
  id: string;
  title: string;
  category: string;
  price: number;
  views: number;
  orders: number;
  score: number;
  status: ListingStatus;
  description: string;
  tags: string[];
  currentTitle: string;
  suggestedTitle: string;
  recommendedPrice: number;
  imageUrl: string;
  imageIssue: string;
};

export const listings: Listing[] = [
  {
    id: "1",
    title: "Couple Rakhi Set",
    category: "Rakhi",
    price: 3.49,
    views: 321,
    orders: 18,
    score: 62,
    status: "Needs Attention",
    description:
      "Handmade couple Rakhi set designed for Raksha Bandhan gifting.",
    tags: [
      "couple rakhi",
      "rakhi set",
      "raksha bandhan",
      "handmade rakhi",
      "brother gift",
    ],
    currentTitle:
      "Couple Rakhi Set Handmade Rakhi for Brother and Bhabhi",
    suggestedTitle:
      "Handmade Couple Rakhi Set for Brother and Bhabhi, Raksha Bandhan Gift",
    recommendedPrice: 4.25,
    imageUrl: "/placeholder-product.jpg",
    imageIssue: "The product appears too small in the frame and the image could be brighter.",
  },
  {
    id: "2",
    title: "Evil Eye Bracelet",
    category: "Bracelet",
    price: 8.99,
    views: 280,
    orders: 14,
    score: 74,
    status: "Needs Attention",
    description:
      "Handmade evil eye bracelet for protection and gifting.",
    tags: [
      "evil eye bracelet",
      "protection bracelet",
      "handmade jewelry",
      "gift for her",
      "blue bracelet",
    ],
    currentTitle:
      "Evil Eye Bracelet Handmade Bracelet Protection Jewelry",
    suggestedTitle:
      "Handmade Evil Eye Protection Bracelet, Blue Jewelry Gift for Her",
    recommendedPrice: 9.99,
    imageUrl: "/placeholder-product.jpg",
    imageIssue: "The product appears too small in the frame and the image could be brighter.",
  },
  {
    id: "3",
    title: "Bridal Ear Chain",
    category: "Jewelry",
    price: 12.99,
    views: 160,
    orders: 9,
    score: 58,
    status: "Needs Attention",
    description:
      "Traditional bridal ear chain for wedding and festive jewelry looks.",
    tags: [
      "bridal ear chain",
      "wedding jewelry",
      "indian jewelry",
      "ear jewelry",
      "bridal accessory",
    ],
    currentTitle:
      "Bridal Ear Chain Indian Jewelry Wedding Accessory",
    suggestedTitle:
      "Traditional Bridal Ear Chain, Indian Wedding Jewelry Accessory",
    recommendedPrice: 14.49,
    imageUrl: "/placeholder-product.jpg",
    imageIssue: "The product appears too small in the frame and the image could be brighter.",
  },
  {
    id: "4",
    title: "Pregnancy Bracelet",
    category: "Bracelet",
    price: 15.99,
    views: 510,
    orders: 34,
    score: 91,
    status: "Active",
    description:
      "Thoughtful pregnancy bracelet designed as a gift for expecting mothers.",
    tags: [
      "pregnancy bracelet",
      "new mom gift",
      "expecting mother",
      "baby shower gift",
      "mother bracelet",
    ],
    currentTitle:
      "Pregnancy Bracelet Gift for Expecting Mother",
    suggestedTitle:
      "Pregnancy Bracelet for Expecting Mother, Meaningful Baby Shower Gift",
    recommendedPrice: 16.99,
    imageUrl: "/placeholder-product.jpg",
    imageIssue: "The product appears too small in the frame and the image could be brighter.",
  },
];