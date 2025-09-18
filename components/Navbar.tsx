import { checkUser } from "@/app/lib/checkUser";

const Navbar = () => {
  const user = checkUser();

  return (
    <div>
      <h1>Navbar</h1>
    </div>
  );
};
export default Navbar;
