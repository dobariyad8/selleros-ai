import ListingDetailsClient from "@/components/listing-details/ListingDetailsClient";

type ListingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingDetailsPage({
  params,
}: ListingDetailsPageProps) {
  const { id } = await params;

  return <ListingDetailsClient id={id} />;
}