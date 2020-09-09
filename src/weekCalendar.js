import React, { useState, useEffect } from "react";
import moment from "moment";

const CompanyCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(null);

    const currentDate = moment();
    const weekStart = currentDate.clone().startOf('week');
    const weekEnd = currentDate.clone().endOf('week');

    const header = () => {
        return (
           <div className="week-header">
                <h2 onClick={() => {onDayClick(null)}}>{currentDate.format("MMMM YYYY")}</h2>
           </div>
           );
    };

    const daysOfWeek = () => {  
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(
                <th className="column col-center" key={i}>
                {moment.weekdays(i)}
                </th>
            );
        }
        return <tr className="days row">{days}</tr>;
    };

    const cells = () => {
        const dates = [];

        let day = weekStart;
        let formattedDate = "";
        for (let i = 0; i < 7; i++) {
            formattedDate = moment(day).format("D");
            const cloneDay = day;
            let selectedClass = `column cell ${(moment(selectedDate).isSame(cloneDay) ? " selected-day " : "")}`;
            dates.push(
                <td 
                className={selectedClass} 
                key={day}
                onClick={() => {onDayClick(cloneDay)}} >
                    <span className="Number">
                        {formattedDate}
                    </span>
                </td>
            );
            day = moment(day).add(1, 'day');
        }
        return <tr className="body">{dates}</tr>;
    };

    const sessions = () => {
        let pageInitial = 1;

        let { reservations, error, isLoaded} = FetchData(currentDate, pageInitial);

        if (error) {
            return (<p>Error: {error.message}</p>);
        } else if (!isLoaded) {
            return (<p>Loading...</p>);
        }

        if (selectedDate==null) {
            const filteredReservation = reservations.filter(a => moment(a.date_start).diff(weekStart, 'day')>0 && moment(a.date_start).diff(weekEnd, 'day')<0);
            return (
                <div>
                    <ul key={selectedDate}>
                        <li><h3>Sessions</h3></li>
                        <table class="center">
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Level</th>
                                <th>Coach</th>
                                <th>Date start</th>
                                <th>Duration (minute)</th>
                            </tr>
                        </thead>
                        <tbody>
                        {filteredReservation.map(reservation => (
                            <tr>
                                <td>{reservation.activity}</td>
                                <td>{reservation.level}</td>
                                <td>{reservation.coach}</td>
                                <td>{moment(reservation.date_start).format("dddd Do hh:mm a")}</td>
                                <td>{reservation.duration_minute}</td>
                            </tr>
                        ))}
                        </tbody>
                        </table>
                    </ul>
                </div>    
            );
        } else {
            const reservationsInDate = reservations.filter(a => moment(a.date_start).isSame(selectedDate, 'days'));
            return (
                <div>
                    <ul key={selectedDate}>
                        <li><h3>{moment(selectedDate).format('dddd Do MMMM')}</h3></li>
                        <table class="center">
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Level</th>
                                <th>Coach</th>
                                <th>Time start</th>
                                <th>Duration (minute)</th>
                            </tr>
                        </thead>
                        <tbody>
                        {reservationsInDate.map(reservation => (
                            <tr>
                                <td>{reservation.activity}</td>
                                <td>{reservation.level}</td>
                                <td>{reservation.coach}</td>
                                <td>{moment(reservation.date_start).format("hh:mm a")}</td>
                                <td>{reservation.duration_minute}</td>
                            </tr>
                        ))}
                        </tbody>
                        </table>
                    </ul>
                </div>  
            );
        }
    };

    const onDayClick = (day) => {
        setSelectedDate(day);
    };

    return (
            <div className="calendar">
                <div>{header()}</div> 
                <table class="center">
                    <thead>
                        {daysOfWeek()}
                    </thead>
                    <tbody>{cells()}</tbody>
                </table>   
                <ul>{sessions()}</ul>    
            </div>
       );
    }


function FetchData(currentDate, pageNumber){ 
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [page, setPage] = useState(pageNumber)

    useEffect(() => { 
        const weekStart = currentDate.clone().startOf('week');
        const weekEnd = currentDate.clone().endOf('week');
        let morePage = false;

        async function fetchAPI() {    
            const apiCall = await fetch(`https://back.staging.bsport.io/api/v1/offer/?page=${page}`, {headers: {
                "Accept": "application/json"
            }});
            if (apiCall.ok) {
                const data = await apiCall.json();
                setIsLoaded(true);
                setReservations([...reservations, ...data.results.filter(a => a.company===6 &&
                    moment(a.date_start).diff(weekStart,'day')>0)]);
                if (data.results.filter(a => moment(a.date_start).diff(weekEnd,'day')<0).length) {
                    morePage = true;
                }
            } else {
                const error = new Error('Something went wrong ...');
                setIsLoaded(true);
                setError(error);
            } 
            if (reservations===undefined || reservations.length===0) {
                setPage(page+1);
            } else {
                if (morePage) {
                    setPage(page+1);
                }
            }     
        }   
        fetchAPI();    
    }, [page]);

    return {reservations, error, isLoaded};
};

export default CompanyCalendar;