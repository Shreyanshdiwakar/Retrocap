import React from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';

const LeaderboardContainer = styled.div`
  background: rgba(18, 4, 88, 0.7);
  border: 2px solid var(--primary);
  border-radius: 5px;
  padding: 20px;
`;

const Title = styled.h3`
  color: var(--light);
  margin-bottom: 15px;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 10px;
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHead = styled.thead`
  tr {
    background: var(--primary);
  }
  
  th {
    padding: 10px;
    text-align: left;
    color: var(--text);
  }
`;

const TableBody = styled.tbody`
  tr:nth-child(even) {
    background: var(--dark);
  }
  
  tr:nth-child(odd) {
    background: rgba(18, 4, 88, 0.7);
  }
  
  td {
    padding: 10px;
    text-align: left;
  }
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text);
  font-style: italic;
`;

const Leaderboard = () => {
  const { leaderboard } = useSocket();

  return (
    <LeaderboardContainer>
      <Title className="neon-text">Leaderboard</Title>
      {leaderboard.length > 0 ? (
        <Table>
          <TableHead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </TableHead>
          <TableBody>
            {leaderboard.map((player, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.score}</td>
              </tr>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState>
          No scores recorded yet. Play a game to earn points!
        </EmptyState>
      )}
    </LeaderboardContainer>
  );
};

export default Leaderboard; 