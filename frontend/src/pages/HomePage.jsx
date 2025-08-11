import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200 flex items-center justify-center p-10">
      {/* Outer Card */}
      <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-7xl h-full md:h-[90vh] overflow-hidden border border-base-300">
        <div className="flex h-full pt-10">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer />
            )}
          </div>
        </div>
      </div>
    </div>


  );
};
export default HomePage;