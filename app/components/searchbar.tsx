export default function Searchbar(props:any){
    const placeholder = props.placeholder;
    const id = props.id 

    return(
        <input type="text" id={id} placeholder={placeholder}/>
    )
}