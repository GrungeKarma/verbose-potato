
import './App.css';
import env from 'react-dotenv';

function App() {

  console.log(env.SECRET_MESSAGE)
  console.log(env.SECOND_SECRET);
  return (
    <h1>hello</h1>
  )
}

export default App;
