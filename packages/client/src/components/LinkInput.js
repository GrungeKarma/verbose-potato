import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';


const LinkInput = () => {
  const link = useRef(null);
  const [listData, setListData] = useState([]);
  const [loading, setIsLoading] = useState(true);
  const [userInput, setUserInput] = useState(null)
  const [clicked, setIsClicked] = useState(false);



  useEffect(() => {
    if (clicked) {
      (async () => {
        await axios.post('http://localhost:6060/gen_data', { link: userInput }).then(res => {
          setListData([...listData, res.data]);
          setIsLoading(false);
          setIsClicked(false);
        }).catch(err => {
          console.log(err)
          setIsLoading(false);
          setIsClicked(false);

        })



      })()
    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInput])



  const itemSubmitHandler = (e) => {
    e.preventDefault()
    setIsLoading(true);
    setIsClicked(true);
    setUserInput(link.current.value);
  }



  return (
    <form onSubmit={itemSubmitHandler}>
      <input
        type="text"
        name="Link"
        ref={link}
      />
      <button>Submit</button>
      {loading ? console.log('waiting for Input') : listData.map(item => {
        return (
          <>
            <h1>{item.name}</h1>
            <h2>{item.price}</h2>
            <img alt='list item' src={`data:image/png;base64,${item.image}`}></img>

          </>
        )
      })}



    </form>

  );

}
export default LinkInput;
