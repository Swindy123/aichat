interface HomeProps {
  onStart: () => void;
}

function Home({ onStart }: HomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-12">
          AI 脑筋急转弯
        </h1>
        <button
          onClick={onStart}
          className="px-12 py-4 bg-white text-gray-800 text-xl font-medium rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-gray-300"
        >
          开始游戏
        </button>
      </div>
    </div>
  );
}

export default Home;
