import React from "react";

export default function InventoryReport(){

     const boxStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    flex: 1,
    margin: "10px",
    backgroundColor: "#f9f9f9",
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "space-around",
    margin: "20px 0",
  };

  const numberStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: "10px 0",
  };

    const [dateRange, setDateRange] = React.useState({
            from_date: new Date().toISOString().split("T")[0], 
            to_date: new Date().toISOString().split("T")[0]
        });

    const [invLogs, setInvLogs] = React.useState<any[]>()
    const [itemInOut, setItemInOut] = React.useState({
        item_in: 0,
        item_out: 0
    })

    let totalItemIn = 0;
    let totalItemOut = 0;

    React.useEffect(() => {
        
        if(invLogs?.length > 0){
            for(const item of invLogs){
                totalItemIn += item.item_in;
                totalItemOut += item.item_out
                console.log(totalItemIn)
            }

        setItemInOut({...itemInOut, item_in: totalItemIn, item_out: totalItemOut})
        }

    }, [invLogs])
    
    console.log(invLogs)
    console.log(itemInOut)
    
        React.useEffect(() => {
            fetch(`http://localhost:5000/getinvlogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
            .then(res => res.json())
            .then(data => setInvLogs(data))
        }, [])

        React.useEffect(() => {
                fetch(`http://localhost:5000/getinvlogs?fromdate=${dateRange.from_date}&todate=${dateRange.to_date}`)
            .then(res => res.json())
            .then(data => setInvLogs(data))
        }, [dateRange])

    return(
        <div className="route-page">
            <h1 className="route-header">Inventory Report</h1>

            <div style={{margin: '2rem 0', display: 'flex', gap: '2rem'}}>
                <label htmlFor="">From
                    <input type="date" value={dateRange?.from_date} onChange={(e) => setDateRange({...dateRange, from_date: e.target.value})}/>
                </label>
                
                <label htmlFor="">To
                    <input type="date"  value={dateRange?.to_date} onChange={(e) => setDateRange({...dateRange, to_date: e.target.value})}></input>
                </label>  
            </div>

            <div style={containerStyle}>
                <div style={boxStyle}>
                    <div>Total Item In</div>
                    <div style={numberStyle}><p style={{color: '#6EC207'}}>-{itemInOut.item_in}</p></div>
                </div>
                <div style={boxStyle}>
                    <div>Total Item Out</div>
                    <div style={numberStyle}><p style={{color: 'red'}}>-{itemInOut.item_out}</p></div>
                </div>
            </div>

            

            <table>
                <tr>
                    <th style={{width: '70px'}}>ID</th>
                    <th>Supply</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Item In</th>
                    <th>Item Out</th>
                </tr>
                {invLogs?.map(inv => {
                    return(
                        <tr>
                            <td>{inv.inv_id}</td>
                            <td>{inv.supply_name}</td>
                            <td>{inv.batch_number}</td>
                            <td>{inv.inv_date}</td>
                            <td>{inv.item_in}</td>
                            <td>{inv.item_out}</td>
                        </tr>
                    )
                    })
                }
            </table>
        </div>
    )
}