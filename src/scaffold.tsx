const Scaffold = ({ children }) => (
  <main class="flex h-full flex-col items-center justify-between">
    {children}
    <div class="px-1 py-8">
      Made with 💜 by{" "}
      <a
        class="text-green-300 hover:underline"
        href="https://github.com/FlorianRaediker"
        rel="noopener"
      >
        flo (Taylor’s Version)
      </a>
    </div>
  </main>
)

export default Scaffold
