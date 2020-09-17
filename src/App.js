import React, {useState, useEffect} from 'react';
import './App.css';
import moment from "moment";

function App() {
  const currentDate = moment();
  const weekStart = currentDate.clone().startOf('week');
  const weekEnd = currentDate.clone().endOf('week');
  const minDate = weekStart.format("YYYY-MM-DD")
  const maxDate = weekEnd.format("YYYY-MM-DD")

  return (
    <div className="App">
      <Calendar 
      currentDate = {currentDate}
      weekStart = {weekStart}
      weekEnd = {weekEnd}
      url = {{offer: `https://back.staging.bsport.io/api/v1/offer/?min_date=${minDate}&max_date=${maxDate}&company=6`,
      coach: "https://back.staging.bsport.io/api/v1/coach/?id__in=",
      }}
      />  
    </div>
  );
}



function Fetcher(url){ 
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [offers, setOffers] = useState([]);
  const [coachs, setCoachs] = useState([]);

  useEffect(() => {
    fetch(url.offer)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong ...')
      }
    })
    .then(data => {
      setOffers(data.results);
      setIsLoaded(true);
      const coachId = [...new Set(data.results.map(x => x.coach))];
      return fetch(url.coach + coachId);
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong ...')
      }
    })
    .then(data => {
      setCoachs(data.results);
      setIsLoaded(true);
    })
    .catch(error => {
      setError([error]);
      setIsLoaded(true);
    })
  }, []);
  
  return ({offers, coachs, error, isLoaded});
}

const Header = (props) => {
  return (
     <div className="week-header">
          <h2 onClick={() => {props.onChange(null)}}>
            {props.currentDate.format("MMMM YYYY")}
          </h2>
     </div>
     );
}

const daysOfWeek = () => {  
  const days = [0, 1, 2, 3, 4, 5, 6];
  return (<tr>
    {days.map(day => <th>{moment.weekdays(day)}</th>)}
    </tr>
    );
}

const Cells = (props) => {
  const dates = [];
  let day = props.weekStart;
  let formattedDate = "";
  for (let i = 0; i < 7; i++) {
      formattedDate = moment(day).format("D");
      const cloneDay = day;
      let selectedClass = `column cell ${(moment(props.selectedDate).isSame(cloneDay) ? " selected-day " : "")}`;
      dates.push(
          <td
          className={selectedClass}
          key={day}
          onClick={() => {props.onChange(cloneDay)}} >
              <span>{formattedDate}</span>
          </td>
      );
      day = moment(day).add(1, 'day');
  }
  return <tr className="body">{dates}</tr>;
}


const ShowSessions = (props) => {
  return (
    <div>
      <ul key={props.selectedDate}>
        <li><h3>Sessions</h3></li>
          <table class="center">
          <thead>
              <tr>
                <th>Activity</th>
                <th>Level</th>
                <th>Coach name</th>
                <th>Coach ID</th>
                <th>Date start</th>
                <th>Duration (minute)</th>
              </tr>
          </thead>
          <tbody>
          {props.offer_coach.map(offer => (
            <tr>
              <td>{offer.activity}</td>
              <td>{offer.level}</td>
              <td>{offer.name}</td>
              <td>{offer.coach}</td>
              <td>{moment(offer.date_start).format("dddd Do hh:mm a")}</td>
              <td>{offer.duration_minute}</td>
            </tr>
          ))}
          </tbody>
          </table>
      </ul>
  </div> 
  );
}

const Sessions = (props) => {
  let {offers, coachs, error, isLoaded} = Fetcher(props.url);
  if (!offers) {
    return (<p>No offer yet ...</p>);
  }
  if (error) {
    return (<p>Error in load offers: {error.message}</p>);
  } 
  if (!isLoaded) {
      return (<p>Loading ...</p>);
  }
  const filteredOffers = offers.filter(a => moment(a.date_start).diff(props.weekStart,'days')>0 
    && moment(a.date_start).diff(props.weekEnd,'days')<0);
  const filteredCoachs = [];
  coachs.map(item => filteredCoachs.push({id: item.id, name: item.user.name}));

  const offer_coach = filteredOffers.map(x => Object.assign({}, x, filteredCoachs.find(y => y.id === x.coach)));
  let filteredOfferCoach = offer_coach;
  if (props.selectedDate!=null) {
    filteredOfferCoach = offer_coach.filter(a => moment(a.date_start).isSame(props.selectedDate,'days'));
  }

  return <ShowSessions offer_coach={filteredOfferCoach}/>;
}


const Calendar = (props) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const onDayClick = (day) => {
    setSelectedDate(day);
  }

  return (
    <div className="calendar">
        <div><Header {...props} onChange={onDayClick.bind(this)}/></div> 
        <table class="center">
            <thead>
                {daysOfWeek()}
            </thead>
            <tbody>
              <Cells {...props} 
              selectedDate={selectedDate}
              onChange={onDayClick.bind(this)}/>
            </tbody>
        </table>       
        <ul><Sessions {...props} selectedDate={selectedDate}/></ul>     
    </div>
  );
}

export default App;
