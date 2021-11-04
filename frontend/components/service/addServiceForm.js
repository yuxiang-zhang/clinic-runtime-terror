import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Close } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import styled from "../../styles/service.module.css";
import {useState} from "react";
import Paper from "@mui/material/Paper";
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  InputAdornment
} from "@mui/material";
import ServiceCardRow from "./serviceCardRow";


const AddServiceForm = (props) => {
  const { addHandle , employeeList ,closeAddDialog} = props;
  const [employeeCheckList , setEmployeeCheckList] = useState([]);
  const [name , setName] = useState('');
  const [code , setCode] = useState('');
  const [description , setDescription] = useState('');
  const [duration , setDuration] = useState(0);
  const [price, setPrice] = useState(0);
  const processAddService=()=>{
    //processData from the code name description and emplyee list

    if(validationInput()){
      let Data = {}
      addHandle(Data);
    }

  }
  const handleCheck =(e)=>{
    if(e.target.checked){
      setEmployeeCheckList([...employeeCheckList,e.target.value]);
    }
    else{
      setEmployeeCheckList(employeeCheckList.filter((name)=>e.target.value!=name));
    }
  }
  const durationSelect=(hour)=>{
    setDuration(hour*60000)
    // console.log(Object.keys(item)==duration)
  }

  const durationList = [{30:'30 M'},{ 60: '1 H'}, { 90: '1.5H'},{120: '2H'}]


  const handleSetValue = (e)=>{
    let label = e.target.id;
    let value = e.target.value.trim();
    switch (label){
      case 'name':
          setName(value);
        break;
      case 'code':
          setCode(value);
        break;
      case 'description':
          setDescription(value);
        break;
      case 'price':
        setPrice(value);
        break;
    }
  }

  const validationInput = ()=>{
    if(name =='' ||code =='' ||price<=0){
      return false;
    }
    return true;


  }
  return (
    <div>
      <Dialog open={true} fullWidth={true} maxWidth="lg" scroll="body">
        <DialogTitle>
          New Service
          <IconButton
            aria-label="close"
            onClick={closeAddDialog}
            size="medium"
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent >

          <div className={styled.separateVDiv}></div>
          <TextField
              fullWidth
              required
              id="name"
              label="Service name"
              value={name}
              onChange={(event)=>handleSetValue(event)}
          />
          <div className={styled.separateVDiv}></div>
          <TextField
              fullWidth
              required
              id="code"
              label="Service code"
              value={code}
              onChange={(event)=>handleSetValue(event)}
          />
          <div className={styled.separateVDiv}></div>
            <TextField
                fullWidth
                id="description"
                label="Description"
                multiline
                rows={4}
                value={description}
                onChange={(event)=>handleSetValue(event)}
            />
          <div className={styled.separateVDiv}></div>
          <div className={styled.flexAlignContainer}>
            <h3>Duration</h3>
            {durationList.map((item) => (
                <Fab key={Object.keys(item)} onClick={()=>durationSelect(Object.keys(item))} color={Object.keys(item)*60000==duration?'primary':null} variant="extended">{Object.values(item)}</Fab>
            ))}
          </div>
          <div className={styled.separateVDiv}></div>
          <TextField
              id="price"
              label="price"
              type='number'
              value={price}
              required
              onChange={(event)=>handleSetValue(event)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
          />
          <div className={styled.separateVDiv}></div>
          <h1>Add Employee</h1>
          <TableContainer component={Paper}>
            <Table sx={{minWidth: 650}} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center"><h1>Employee name</h1></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeList.map((ename) => (
                    <TableRow
                        key={ename}
                        sx={{'&:last-child td, &:last-child th': {border: 0}}}
                    >
                      <TableCell component="th" scope="row">
                        <div className={styled.employeeRowDiv}>
                          {ename}
                        <Checkbox
                            key={ename}
                            aria-label={ename}
                            value={ename}
                            checked={employeeCheckList.includes(ename)}
                            onChange={(event) => {
                              handleCheck(event)
                            }}
                        />
                        </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </DialogContent>
        <DialogActions>
          <Button onClick={processAddService}>Create Service</Button>
          <Button onClick={closeAddDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default AddServiceForm;
