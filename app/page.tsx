import Guest from "@/components/Guest";
import { currentUser } from "@clerk/nextjs/server";

const HomePage = async () => {
  const user = await currentUser();

  if (!user) {
    return <Guest />;
  }

  return (
    <div>
      <h1 className="text-red-500">Home Page</h1>
    </div>
  );
};
export default HomePage;
