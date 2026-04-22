import { useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import defaultProfileImg from "../../assets/profile_image.svg";
import useUiStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore";

const AccountManager = () => {
  const navigate = useNavigate();
  const accountManagerRef = useRef<HTMLDivElement>(null);

  const isAccountManagerOpen = useUiStore(
    (state) => state.isAccountManagerOpen
  );
  const closeAccountManager = useUiStore((state) => state.closeAccountManager);
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const closeModalOnClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        accountManagerRef.current &&
        !accountManagerRef.current.contains(target)
      ) {
        if (target.closest("#accountManagerButton")) {
          return;
        }
        closeAccountManager();
      }
    };
    if (isAccountManagerOpen) {
      document.addEventListener("click", closeModalOnClickOutside, true);
    }
    return () => {
      document.removeEventListener("click", closeModalOnClickOutside, true);
    };
  }, [isAccountManagerOpen, closeAccountManager]);

  const onSignOutClickHandler = () => {
    closeModal();
    logout();
    window.location.reload();
  };

  const signOutHandler = () => {
    // signout
    openModal(
      <div>
        <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
        <p>Are you sure you want to sign out of your account?</p>
        <button
          onClick={onSignOutClickHandler}
          className="mt-3 px-3 py-1.5 bg-red-500 text-white rounded hover:cursor-pointer font-semibold"
        >
          Sign Out
        </button>
      </div>
    );
  };

  return (
    <>
      {isAccountManagerOpen && (
        <div
          ref={accountManagerRef}
          className="absolute w-80 bg-white right-0 top-12 z-40 animate-fadeFillSlow delay-0 max-w-full"
          style={{
            boxShadow:
              "0 24px 54px rgba(0,0,0,.15), 0 4.5px 13.5px rgba(0,0,0,.08)",
            color: "#333",
            height: "180px",
            transition: "visibility 0s linear 120ms,opacity 120ms ease",
          }}
        >
          {isAuthenticated ? (
            <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[1fr_3fr] leading-normal items-stretch h-full text-black">
              <div className="col-start-1 col-end-2 self-center text-sm px-4">
                {user && user.role === 'admin' ? (
                  <span className="bg-chemnitz-blue text-white px-2 py-1 rounded-md font-bold text-xs shadow-md">
                    ADMIN ACCOUNT
                  </span>
                ) : (
                  "Welcome!"
                )}
              </div>

              <div className="col-start-1 col-end-4 min-h-[132px self-center] flex">
                <div className="w-20 h-20 m-5  overflow-hidden rounded-full">
                  {user && user.profileImage ? (
                    <img src={user.profileImage} alt="user profile image" />
                  ) : (
                    <img src={defaultProfileImg} alt="default profile image" />
                  )}
                </div>
                <div className="grow pr-3 mt-4">
                  <div className="font-semibold text-lg">
                    {user && user.username ? user.username : user && user.email}
                  </div>
                  <div className="mt-1 font-semibold">{user && user.email}</div>

                  <button
                    onClick={() => {window.location.pathname = "/my-account"}}
                    className="mt-1 font-semibold underline text-blue-hover hover:cursor-pointer hover:text-[#132395]"
                  >
                    My account
                  </button>
                </div>
              </div>
              <div
                className="col-start-3 col-end-4 row-start-1 p-3 text-sm self-center font-semibold hover:bg-white-hover hover:underline hover:cursor-pointer"
                onClick={signOutHandler}
              >
                sign out
              </div>
            </div>
          ) : (
            <div className="p-8 h-full w-full flex flex-col justify-center items-center text-light-text">
              <h2 className="text-center">
                You're not logged in.
                <br />
                Please log in
              </h2>
              <button
                className="text-lg font-semibold border rounded-md w-[80%] border-light-text hover:bg-white-hover duration-75 hover:cursor-pointer mt-4 py-1"
                onClick={() => navigate("/sign-in")}
                title="sign in"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AccountManager;